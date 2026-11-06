const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const GET = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return new Response('Supabase is not configured', { status: 500 });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!response.ok) return new Response(`Supabase answered ${response.status}`, { status: 502 });
  return new Response('ok');
};
