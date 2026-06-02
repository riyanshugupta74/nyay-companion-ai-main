import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating legal notice for:', formData.recipientName);

    // Auto-generate current date in Indian format
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Legal terms mapping based on case type/relationship
    const legalTermsByType: Record<string, string> = {
      'e-commerce': 'Consumer Protection Act, 2019; E-Commerce Rules, 2020; Information Technology Act, 2000; Indian Contract Act, 1872',
      'bank': 'Banking Regulation Act, 1949; Reserve Bank of India Act, 1934; Consumer Protection Act, 2019; Indian Contract Act, 1872',
      'insurance': 'Insurance Act, 1938; IRDAI Regulations; Consumer Protection Act, 2019; Indian Contract Act, 1872',
      'telecom': 'Telecom Regulatory Authority of India Act, 1997; TRAI Regulations; Consumer Protection Act, 2019',
      'real-estate': 'Real Estate (Regulation and Development) Act, 2016 (RERA); Transfer of Property Act, 1882; Indian Contract Act, 1872',
      'service': 'Consumer Protection Act, 2019; Indian Contract Act, 1872; Specific Relief Act, 1963',
      'employer': 'Industrial Disputes Act, 1947; Payment of Wages Act, 1936; Indian Contract Act, 1872',
      'landlord': 'Transfer of Property Act, 1882; Rent Control Act (State specific); Indian Contract Act, 1872',
      'tenant': 'Transfer of Property Act, 1882; Rent Control Act (State specific); Indian Contract Act, 1872',
      'individual': 'Indian Contract Act, 1872; Specific Relief Act, 1963; Indian Penal Code, 1860',
      'government': 'Constitution of India; Administrative Law; Public Accountability',
      'other': 'Indian Contract Act, 1872; Consumer Protection Act, 2019; Specific Relief Act, 1963'
    };

    const applicableLaws = legalTermsByType[formData.relationshipType] || legalTermsByType['other'];

    const systemPrompt = `You are NyayNotice, an AI legal notice generator specialized in Indian law. Generate a professional, legally compliant legal notice that is SELF-DRAFTED by the customer directly - NOT through an advocate.

IMPORTANT: This is a SELF-DRAFTED LEGAL NOTICE sent directly by the aggrieved party (customer), NOT through a lawyer. 
- Do NOT include any "Under Instructions From" clause
- Do NOT include any advocate/lawyer signature or details
- The notice should be signed by the SENDER (customer) themselves
- Use "I, [Name], S/o or D/o or W/o [Father's/Husband's Name]" format
- The closing should have the sender's own signature block, NOT an advocate's

AUTO DATE: The notice date is ${currentDate}. You MUST include this date at the very top of the notice after the LEGAL NOTICE header.

AUTO LEGAL TERMS: Based on the relationship type "${formData.relationshipType}", automatically include references to these applicable laws where relevant: ${applicableLaws}

CRITICAL - INTELLIGENT ISSUE DETECTION:
The user may select one issue type (like "Delay in Delivery") but describe a completely different problem in their description. YOU MUST:
1. IGNORE the selected "Nature of Issue" if the problem description clearly describes something else
2. Analyze the actual problem description to determine the TRUE nature of the issue
3. Apply the correct legal provisions based on what actually happened, NOT what was selected
4. Generate the notice based on the ACTUAL issue described

The legal notice MUST follow Indian legal standards and include:
1. Professional header with "LEGAL NOTICE" title
2. DATE: ${currentDate} (mandatory - place immediately after header)
3. PLACE: ${formData.senderCity}, ${formData.senderState}
4. "FROM:" section with sender's complete details INCLUDING Father's/Husband's Name (S/o, D/o, or W/o format)
5. "TO:" section with recipient's complete details
6. Subject line clearly stating the ACTUAL matter
7. Opening paragraph: "I, [Full Name], S/o (or D/o or W/o) [Father's/Husband's Name], residing at [Address], do hereby serve this Legal Notice upon you as follows:"
8. Chronological statement of facts with dates
9. Legal grounds - AUTOMATICALLY include formal legal language citing: ${applicableLaws}
   Use phrases like:
   - "Under the provisions of..."
   - "In accordance with Section X of..."
   - "As per the mandate of..."
   - "Your actions constitute a violation of..."
   - "You are liable under..."
10. Clear demand/relief sought with legal basis
11. Time-bound compliance deadline
12. Consequences of non-compliance: "Failing which, I shall be constrained to initiate appropriate civil and/or criminal proceedings against you, including but not limited to filing a complaint before the appropriate forum, and you shall be liable to pay all costs, damages, and compensation as may be awarded."
13. Closing: "Yours faithfully," followed by sender's name and contact details (NO advocate signature)

CRITICAL - COMPANY CONTACT DETECTION:
Based on the recipient company/person name, you MUST detect and provide their official contact details. For major Indian companies, use these known emails:
- Flipkart: grievance.officer@flipkart.com, cs@flipkart.com
- Amazon India: grievance-officer@amazon.in, cs-india@amazon.in
- Swiggy: care@swiggy.in, grievance@swiggy.in
- Zomato: grievance@zomato.com, legal@zomato.com
- Paytm: grievance@paytm.com, nodal@paytm.com
- PhonePe: grievance.officer@phonepe.com
- Ola: support@olacabs.com, grievance.officer@olacabs.com
- Uber India: grievance-officer-india@uber.com
- HDFC Bank: grievance.redressal@hdfcbank.com
- ICICI Bank: headservicequality@icicibank.com
- SBI: customercare@sbi.co.in
- Airtel: grievance.officer@airtel.com
- Jio: care@jio.com, grievance.officer@ril.com
- Vodafone Idea: appellate.authority@vodafoneidea.com
For any other company, try to provide their official grievance/legal/customer care email.

ALWAYS provide email for companyDetails. If you're uncertain, provide the most likely official email format (like grievance@company.com or support@company.com).

Your response MUST be in this exact JSON format:
{
  "noticeContent": "Complete legal notice text with proper formatting. MUST start with date ${currentDate}. Use actual newlines for line breaks.",
  "subject": "Subject line for the legal notice based on ACTUAL issue",
  "summary": "Brief 2-3 sentence summary of the notice",
  "recommendedDeadline": "7/15/30 days based on case severity",
  "detectedIssue": "The actual issue type detected from the description",
  "nextSteps": [
    "Step-by-step guidance on what to do after generating notice"
  ],
  "sendingInstructions": [
    "Instructions on how to send the legal notice (Speed Post, Email, etc.)"
  ],
  "companyDetails": {
    "email": "REQUIRED - Official customer grievance/legal email (NEVER null for known companies)",
    "phone": "Customer support helpline number if known, or null",
    "website": "Official company website if known, or null",
    "address": "Registered office address if known, or null",
    "confidence": "high/medium/low"
  },
  "legalForum": "Recommended legal forum if notice is ignored"
}

Important guidelines:
- This is a SELF-DRAFTED notice by the customer - NO advocate involved
- Use formal legal English appropriate for Indian courts
- Do NOT use threatening or emotional language
- ALWAYS include the date ${currentDate} at the top of the notice
- ALWAYS include relevant legal provisions from: ${applicableLaws}
- ALWAYS include sender's name with Father's/Husband's Name in proper legal format
- The signature block should be: "Yours faithfully, [Sender Name], S/o (or D/o or W/o) [Father's Name], [Address], [Mobile], [Email]"
- Do NOT mention any advocate or lawyer anywhere in the notice
- Use ACTUAL newlines in the noticeContent, not \\n escape sequences

Always respond with valid JSON only, no additional text.`;

    const userMessage = `Generate a legal notice with the following details:

SENDER DETAILS:
- Full Name: ${formData.senderName}
- Father's/Husband's Name: ${formData.senderFatherName || 'Not provided'}
- Address: ${formData.senderAddress}
- City: ${formData.senderCity}, ${formData.senderState} - ${formData.senderPincode}
- Mobile: ${formData.senderMobile}
- Email: ${formData.senderEmail}

RECIPIENT DETAILS:
- Name/Company: ${formData.recipientName}
- Registered Office: ${formData.recipientAddress || 'Not provided'}
- Branch Address: ${formData.branchAddress || 'Not applicable'}

RELATIONSHIP/TRANSACTION:
- Relationship Type: ${formData.relationshipType}
- Date of Purchase/Agreement: ${formData.transactionDate || 'Not specified'}
- Invoice/Order ID: ${formData.orderId || 'Not provided'}
- Amount Paid: ${formData.amountPaid ? `Rs.${formData.amountPaid}` : 'Not specified'}

PROBLEM DETAILS (ANALYZE THIS CAREFULLY - This is the ACTUAL issue regardless of what is selected below):
- Detailed Issue Description: ${formData.problemDescription}
- User Selected Issue Type (may be incorrect): ${formData.issueNature}
- Loss/Harassment Faced: ${formData.lossDescription || 'Not specified'}

IMPORTANT: If the detailed description describes a DIFFERENT issue than what was selected, use the ACTUAL issue from the description. For example, if "Delay in Delivery" is selected but the description talks about fraud or cheating, treat it as fraud.

PREVIOUS ACTIONS:
- Customer Care Contacted: ${formData.customerCareContacted || 'No'}
- NCH Complaint Registered: ${formData.nchComplaint || 'No'}
- Complaint ID: ${formData.complaintId || 'Not applicable'}
- Police Complaint Filed: ${formData.policeComplaint || 'No'}

RELIEF DEMANDED:
- Resolution Type: ${formData.resolutionType}
- Amount Demanded: ${formData.amountDemanded ? `Rs.${formData.amountDemanded}` : 'Not specified'}
- Other Relief: ${formData.otherRelief || 'Not specified'}

RESPONSE TIME: ${formData.responseTime || '15'} days`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('Legal notice generated successfully');

    // Parse the JSON response
    let noticeData;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      noticeData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      noticeData = {
        noticeContent: content || "Unable to generate legal notice. Please try again.",
        subject: `Legal Notice - ${formData.issueNature}`,
        summary: "Legal notice generated for your review.",
        recommendedDeadline: "15",
        nextSteps: ["Review the notice carefully", "Send via Speed Post"],
        sendingInstructions: ["Send via Registered Post/Speed Post", "Keep postal receipt as proof"],
        companyDetails: null,
        legalForum: "Consumer Court / Civil Court"
      };
    }

    return new Response(JSON.stringify({ notice: noticeData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in nyaynotice function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});