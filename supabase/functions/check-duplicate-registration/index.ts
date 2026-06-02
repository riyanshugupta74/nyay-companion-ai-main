import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { email, mobile } = await req.json();

    // Check for duplicate email in auth.users
    if (email) {
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      );
      if (emailExists) {
        return new Response(
          JSON.stringify({ 
            duplicate: true, 
            field: "email",
            message: "This email is already registered. Please login instead." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Check for duplicate mobile in profiles
    if (mobile) {
      const normalizedMobile = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
      
      const { data: existingProfiles } = await adminClient
        .from('profiles')
        .select('mobile')
        .not('mobile', 'is', null);

      const mobileExists = existingProfiles?.some((profile) => {
        if (!profile.mobile) return false;
        const profileMobile = profile.mobile.replace(/\s+/g, '').replace(/^\+91/, '');
        return profileMobile === normalizedMobile;
      });

      if (mobileExists) {
        return new Response(
          JSON.stringify({ 
            duplicate: true, 
            field: "mobile",
            message: "This mobile number is already registered. Please login instead." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ duplicate: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error checking duplicates:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
