import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, chatId, userId, payload } = await req.json();
    const target = (chatId ?? userId) as string | undefined;
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "token required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!target || typeof target !== "string") {
      return new Response(JSON.stringify({ error: "chatId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://platform-api.max.ru/messages?chat_id=${encodeURIComponent(target)}`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload ?? {}),
    });

    const text = await upstream.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* keep as text */ }

    return new Response(JSON.stringify({ status: upstream.status, ok: upstream.ok, body }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("max-send error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
