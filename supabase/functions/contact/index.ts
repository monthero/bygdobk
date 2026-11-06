import { withSupabase } from 'npm:@supabase/server@1';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@4';

const ALLOWED_ORIGINS = new Set(['http://localhost:5173', 'https://bigdobk.vercel.app']);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const CONTACT_TO = Deno.env.get('CONTACT_TO');
const CONTACT_FROM = Deno.env.get('CONTACT_FROM');

// Keep in sync with src/data/contact.ts.
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;
const LABEL_MAX = 120;
const SUBJECT_MAX = 300;

const Honeypot = z.object({ website: z.string().trim().min(1) });

const Label = z.string().trim().min(1).max(LABEL_MAX);

const ContactMessage = z.object({
  subject: z.string().trim().min(1).max(SUBJECT_MAX),
  topic: Label,
  labels: z.object({ topic: Label, name: Label, email: Label }),
  name: z.string().trim().min(1).max(NAME_MAX),
  email: z.email().max(EMAIL_MAX),
  message: z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX),
});
type ContactMessage = z.infer<typeof ContactMessage>;

const corsFor = (origin: string | null) => {
  const headers = new Headers({ Vary: 'Origin' });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  return headers;
};

const reply = (status: number, body: Record<string, unknown>) => Response.json(body, { status });

const oneLine = (text: string) => text.replaceAll(/\s+/g, ' ');

const sendEmail = async ({ subject, topic, labels, name, email, message }: ContactMessage) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: email,
      subject: oneLine(subject),
      text: `${labels.topic}: ${oneLine(topic)}\n${labels.name}: ${oneLine(name)}\n${labels.email}: ${email}\n\n${message}\n`,
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
};

const handle = withSupabase({ auth: 'publishable', cors: 'disabled', errors: { detailed: false } }, async (req) => {
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  const body: unknown = await req.json().catch(() => null);
  if (Honeypot.safeParse(body).success) return reply(200, { ok: true });

  const parsed = ContactMessage.safeParse(body);
  if (!parsed.success) return reply(400, { error: 'Invalid message' });

  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    console.error('Missing RESEND_API_KEY, CONTACT_TO or CONTACT_FROM');
    return reply(500, { error: 'Could not send message' });
  }

  try {
    await sendEmail(parsed.data);
  } catch (error) {
    console.error('Sending contact email failed', error);
    return reply(502, { error: 'Could not send message' });
  }
  return reply(200, { ok: true });
});

export default {
  fetch: async (req: Request) => {
    const cors = corsFor(req.headers.get('origin'));
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const res = await handle(req);
    const withCors = new Response(res.body, res);
    for (const [key, value] of cors) withCors.headers.set(key, value);
    return withCors;
  },
};
