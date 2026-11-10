import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ALLOWED_ORIGINS = new Set(['http://localhost:5173', 'https://bygdobk.vercel.app']);

const corsFor = (origin: string | null) => {
  const headers = new Headers({ Vary: 'Origin' });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  return headers;
};

export const reply = (status: number, body: Record<string, unknown>) => Response.json(body, { status });

export const withCors = (handle: (req: Request) => Promise<Response>) => ({
  fetch: async (req: Request) => {
    const cors = corsFor(req.headers.get('origin'));
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const res = await handle(req);
    const withHeaders = new Response(res.body, res);
    for (const [key, value] of cors) withHeaders.headers.set(key, value);
    return withHeaders;
  },
});
