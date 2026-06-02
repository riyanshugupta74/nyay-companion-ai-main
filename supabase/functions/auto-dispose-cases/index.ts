import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find cases where disposal was requested more than 48 hours ago
    // and status is not already disposed
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: casesToDispose, error: fetchError } = await supabase
      .from("cases")
      .select("*")
      .not("disposal_requested_at", "is", null)
      .is("disposal_confirmed_at", null)
      .neq("status", "disposed")
      .lt("disposal_requested_at", fortyEightHoursAgo);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${casesToDispose?.length || 0} cases to auto-dispose`);

    const results = [];

    for (const caseItem of casesToDispose || []) {
      // Update case to disposed
      const { error: updateError } = await supabase
        .from("cases")
        .update({
          status: "disposed",
          disposal_confirmed_at: new Date().toISOString(),
        })
        .eq("id", caseItem.id);

      if (updateError) {
        console.error(`Failed to dispose case ${caseItem.id}:`, updateError);
        results.push({ id: caseItem.id, success: false, error: updateError.message });
        continue;
      }

      // Notify the user
      await supabase.from("notifications").insert({
        user_id: caseItem.user_id,
        title: "Case Auto-Disposed",
        message: `Your ${caseItem.case_type} case has been automatically disposed after 48 hours without lawyer response.`,
        type: "info",
        case_id: caseItem.id,
      });

      // Notify the lawyer
      if (caseItem.lawyer_id) {
        await supabase.from("notifications").insert({
          user_id: caseItem.lawyer_id,
          title: "Case Auto-Disposed",
          message: `Case #${caseItem.id.slice(0, 8).toUpperCase()} has been automatically disposed after 48 hours.`,
          type: "warning",
          case_id: caseItem.id,
        });
      }

      results.push({ id: caseItem.id, success: true });
      console.log(`Auto-disposed case ${caseItem.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in auto-dispose-cases:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
