import { withSupabase } from 'npm:@supabase/server@1';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@4';

const ALLOWED_ORIGINS = new Set(['http://localhost:5173', 'https://bygdobk.vercel.app']);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const CONTACT_TO = Deno.env.get('CONTACT_TO');
const CONTACT_FROM = Deno.env.get('CONTACT_FROM');
const SANITY_PROJECT_ID = Deno.env.get('SANITY_PROJECT_ID');
const SANITY_DATASET = Deno.env.get('SANITY_DATASET');

const SANITY_TIMEOUT_MS = 5000;
const RECIPIENTS_MAX = 10;
const RECIPIENTS_QUERY = `*[_id == "siteSettings"][0]{ "email": club.email, "topic": contactTopics[id == $topicId][0].recipients }`;

// Keep in sync with src/data/contact.ts.
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;
const LABEL_MAX = 120;
const SUBJECT_MAX = 300;
const TOPIC_ID = /^[a-z0-9-]{1,40}$/;

const Honeypot = z.object({ website: z.string().trim().min(1) });

const Label = z.string().trim().min(1).max(LABEL_MAX);

const Email = z.email().max(EMAIL_MAX);

const ContactMessage = z.object({
  subject: z.string().trim().min(1).max(SUBJECT_MAX),
  topicId: z.string().regex(TOPIC_ID).optional(),
  topic: Label.optional(),
  labels: z.object({ topic: Label, name: Label, email: Label }),
  name: z.string().trim().min(1).max(NAME_MAX),
  email: Email,
  message: z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX),
});
type ContactMessage = z.infer<typeof ContactMessage>;

const Recipients = z.object({
  result: z
    .object({
      email: Email.nullish().catch(null),
      topic: z.array(Email).nullish().catch(null),
    })
    .nullable(),
});

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

const fetchRecipients = async (topicId?: string) => {
  if (!SANITY_PROJECT_ID || !SANITY_DATASET) throw new Error('Missing SANITY_PROJECT_ID or SANITY_DATASET');
  const url = new URL(`https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v2026-11-01/data/query/${SANITY_DATASET}`);
  url.searchParams.set('query', RECIPIENTS_QUERY);
  url.searchParams.set('$topicId', JSON.stringify(topicId ?? null));
  const res = await fetch(url, { signal: AbortSignal.timeout(SANITY_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Sanity responded ${res.status}: ${await res.text()}`);
  return Recipients.parse(await res.json()).result;
};

const recipientsFor = async (topicId?: string) => {
  try {
    const found = await fetchRecipients(topicId);
    if (found?.topic?.length) return Array.from(new Set(found.topic)).slice(0, RECIPIENTS_MAX);
    if (found?.email) return [found.email];
  } catch (error) {
    console.error('Looking up contact recipients failed', error);
  }
  return CONTACT_TO ? [CONTACT_TO] : [];
};

const emailText = ({ topic, labels, name, email, message }: ContactMessage) => {
  const lines = [`${labels.name}: ${oneLine(name)}`, `${labels.email}: ${email}`];
  if (topic) lines.unshift(`${labels.topic}: ${oneLine(topic)}`);
  return `${lines.join('\n')}\n\n${message}\n`;
};

const sendEmail = async (to: string[], contact: ContactMessage) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to,
      reply_to: contact.email,
      subject: oneLine(contact.subject),
      text: emailText(contact),
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

  if (!RESEND_API_KEY || !CONTACT_FROM) {
    console.error('Missing RESEND_API_KEY or CONTACT_FROM');
    return reply(500, { error: 'Could not send message' });
  }

  const to = await recipientsFor(parsed.data.topicId);
  if (to.length === 0) {
    console.error('No contact recipients in Sanity and no CONTACT_TO');
    return reply(500, { error: 'Could not send message' });
  }

  try {
    await sendEmail(to, parsed.data);
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
