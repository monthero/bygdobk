import { withSupabase, type SupabaseContext } from '@supabase/server';
import { z } from 'zod';

import { azureLanguage, TranslateRequest, translateItems } from '../../../src/cms/translations/request.ts';
import type { Locale } from '../../../src/i18n/locales.ts';
import { reply, withCors } from '../_shared/http.ts';

const AZURE_KEY = Deno.env.get('AZURE_TRANSLATOR_KEY');
const AZURE_REGION = Deno.env.get('AZURE_TRANSLATOR_REGION');
const AZURE_URL = 'https://api.cognitive.microsofttranslator.com/translate';
const AZURE_TIMEOUT_MS = 20_000;
const AZURE_QUOTA_USED = 403_001;

const RATE_LIMITED = 'Too much at once, try again in a minute.';
const QUOTA_USED = 'The free translation quota is used up. Try again later.';
const FAILED = 'Could not translate';

const Profile = z.object({ is_admin: z.boolean() }).nullable();

const AzureResult = z.array(z.object({ translations: z.array(z.object({ text: z.string(), to: z.string() })) }));

const AzureError = z.object({ error: z.object({ code: z.number() }) });

class TranslatorError extends Error {
  constructor(
    readonly status: number,
    readonly code?: number,
  ) {
    super(`Azure Translator responded ${status}${code ? ` (${code})` : ''}`);
  }
}

const isAdmin = async ({ supabase, userClaims }: SupabaseContext) => {
  if (!userClaims) return false;
  const { data, error } = await supabase.from('profiles').select('is_admin').eq('id', userClaims.id).maybeSingle();
  if (error) throw error;
  return Profile.parse(data)?.is_admin === true;
};

const callAzure = async (from: Locale, to: Locale[], texts: string[], html: boolean) => {
  const url = new URL(AZURE_URL);
  url.searchParams.set('api-version', '3.0');
  url.searchParams.set('from', azureLanguage(from));
  for (const locale of to) url.searchParams.append('to', azureLanguage(locale));
  url.searchParams.set('textType', html ? 'html' : 'plain');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY ?? '',
      'Ocp-Apim-Subscription-Region': AZURE_REGION ?? '',
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(texts.map((text) => ({ Text: text }))),
    signal: AbortSignal.timeout(AZURE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    throw new TranslatorError(res.status, AzureError.safeParse(body).data?.error.code);
  }
  const results = AzureResult.parse(await res.json());
  if (results.length !== texts.length) throw new Error('Azure Translator returned the wrong number of results');
  return results;
};

const failure = (error: unknown) => {
  if (!(error instanceof TranslatorError)) return reply(502, { error: FAILED });
  if (error.status === 429) return reply(429, { error: RATE_LIMITED });
  if (error.code === AZURE_QUOTA_USED) return reply(429, { error: QUOTA_USED });
  return reply(502, { error: FAILED });
};

const handle = withSupabase({ auth: 'user', cors: 'disabled', errors: { detailed: false } }, async (req, ctx) => {
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  try {
    if (!(await isAdmin(ctx))) return reply(403, { error: 'Only board members can translate' });
  } catch (error) {
    console.error('Checking admin access failed', error);
    return reply(500, { error: FAILED });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = TranslateRequest.safeParse(body);
  if (!parsed.success) return reply(400, { error: 'Invalid request' });

  if (!AZURE_KEY || !AZURE_REGION) {
    console.error('Missing AZURE_TRANSLATOR_KEY or AZURE_TRANSLATOR_REGION');
    return reply(500, { error: FAILED });
  }

  try {
    const { from, to } = parsed.data;
    return reply(200, await translateItems(parsed.data, (texts, html) => callAzure(from, to, texts, html)));
  } catch (error) {
    console.error('Translating failed', error);
    return failure(error);
  }
});

export default withCors(handle);
