import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, payload } = await req.json();
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Missing token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ ok: false, error: 'Missing payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://chatapi.viber.com/pa/send_message', {
      method: 'POST',
      headers: {
        'X-Viber-Auth-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: res.ok, status: res.status, body }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
