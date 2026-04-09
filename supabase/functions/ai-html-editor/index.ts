import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, currentHtml } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert email template designer and HTML/CSS developer.
The user gives you an HTML email template (or empty) and an instruction.
You must return ONLY valid HTML code — no explanations, no markdown code blocks, no \`\`\` wrapping.

Guidelines:
- Generate responsive, cross-client compatible HTML email templates
- Use inline CSS styles (email clients don't support <style> blocks well)
- Use table-based layouts for maximum compatibility
- Include proper DOCTYPE and meta tags for email
- Support dark mode with media queries where possible
- Use web-safe fonts with fallbacks
- Images should have alt text and explicit width/height
- Keep the design professional and clean
- If generating from scratch, create a complete email template with header, body, and footer
- If modifying existing HTML, preserve the structure and only apply requested changes
- Always use UTF-8 encoding`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Current HTML:\n${currentHtml || '(empty)'}\n\nInstruction: ${prompt}` },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Недостаточно кредитов AI" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Strip markdown code blocks if AI wraps them
    text = text.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    return new Response(JSON.stringify({ html: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-html-editor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
