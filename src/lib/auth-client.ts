'use client';

import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, phoneNumberClient } from 'better-auth/client/plugins';

function baseURL(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
}

export const authClient = createAuthClient({
  baseURL: baseURL(),
  plugins: [emailOTPClient(), phoneNumberClient()],
});
