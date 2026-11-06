const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const GET = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return new Response('Supabase is not configured', { status: 500 });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/shift_counts`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_event_id: 'keepalive' }),
  });
  if (!response.ok) return new Response(`Supabase answered ${response.status}`, { status: 502 });
  return new Response('ok');
};
