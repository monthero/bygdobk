import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { isAuthError, isAuthImplicitGrantRedirectError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { z } from 'zod';

const AuthErrorCode = z.enum([
  'over_email_send_rate_limit',
  'over_request_rate_limit',
  'email_provider_disabled',
  'otp_disabled',
  'provider_disabled',
  'signup_disabled',
  'email_address_invalid',
  'email_address_not_authorized',
  'otp_expired',
  'flow_state_expired',
  'pkce_code_verifier_not_found',
]);
type AuthErrorCode = z.infer<typeof AuthErrorCode>;

const LINK_EXPIRED = msg`That link has expired. Get a new one below.`;

const MESSAGES: Record<AuthErrorCode, MessageDescriptor> = {
  [AuthErrorCode.enum.over_email_send_rate_limit]: msg`Too many emails for now. Try again later.`,
  [AuthErrorCode.enum.over_request_rate_limit]: msg`Too many tries. Try again in a bit.`,
  [AuthErrorCode.enum.email_provider_disabled]: msg`Email login isn't switched on yet.`,
  [AuthErrorCode.enum.otp_disabled]: msg`Email login isn't switched on yet.`,
  [AuthErrorCode.enum.provider_disabled]: msg`This login isn't switched on yet.`,
  [AuthErrorCode.enum.signup_disabled]: msg`New accounts are closed right now.`,
  [AuthErrorCode.enum.email_address_invalid]: msg`That email won't work. Try another one.`,
  [AuthErrorCode.enum.email_address_not_authorized]: msg`We can't send email to that address yet.`,
  [AuthErrorCode.enum.otp_expired]: LINK_EXPIRED,
  [AuthErrorCode.enum.flow_state_expired]: LINK_EXPIRED,
  [AuthErrorCode.enum.pkce_code_verifier_not_found]: msg`Open the link in the same browser you asked for it in.`,
};

const OFFLINE = msg`Can't reach the server. Check your connection.`;

const SOMETHING_WRONG = msg`Something went wrong. Try again.`;

export const LINK_FAILED = msg`That link didn't work. Get a new one below.`;

export const authErrorMessage = (error: unknown, fallback = SOMETHING_WRONG): MessageDescriptor => {
  if (isAuthRetryableFetchError(error)) return OFFLINE;
  if (!isAuthError(error)) return fallback;
  const code = AuthErrorCode.safeParse(isAuthImplicitGrantRedirectError(error) ? error.details?.code : error.code);
  return code.success ? MESSAGES[code.data] : fallback;
};
