import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, currentText, parseMode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formatInstructions =
      parseMode === 'HTML'
        ? 'Format the output using HTML tags (<b>, <i>, <u>, <a href="...">, <blockquote>).'
        : parseMode === 'Markdown'
          ? 'Format the output using MAX Markdown: **bold**, *italic*, ++underline++, ~~strike~~, [text](url), blockquotes start each line with "> ". Do NOT escape special characters with backslashes.'
          : 'Format the output using Telegram MarkdownV2: *bold*, _italic_, __underline__, ~strike~, [text](url), blockquotes start each line with "> ". Escape ONLY characters that are not part of formatting/markup, per Telegram MarkdownV2 spec (_ * [ ] ( ) ~ ` > # + - = | { } . !).';

    const systemPrompt = `You are an expert marketing copywriter for messenger campaigns (Telegram, MAX).
The user gives you a message text and an instruction. You must return ONLY the improved text — no explanations, no quotes, no code blocks.
${formatInstructions}
Keep the text concise, engaging, and appropriate for a messenger broadcast.
If the current text is empty, generate a new message based on the instruction.`;

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
          { role: "user", content: `Current text:\n${currentText || '(empty)'}\n\nInstruction: ${prompt}` },
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
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-message-editor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});