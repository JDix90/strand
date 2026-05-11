import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP, phoneNumber } from 'better-auth/plugins';
import * as schema from '@/db/schema';
import { db } from '@/lib/db';
import { logDevOtp } from '@/lib/otpLog';
import { isE164Phone } from '@/lib/phone';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-insecure-change-me-min-32-chars-long',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: false,
      async sendVerificationOTP({ email, otp, type }) {
        console.info(`[dev email OTP] ${type} → ${email}: ${otp}`);
        await logDevOtp({ channel: 'email', destination: email, otp, meta: type });
      },
    }),
    phoneNumber({
      phoneNumberValidator: phone => Promise.resolve(isE164Phone(phone)),
      sendOTP: ({ phoneNumber: phone, code }) => {
        console.info(`[dev SMS OTP] → ${phone}: ${code}`);
        void logDevOtp({ channel: 'phone', destination: phone, otp: code, meta: 'phone-verify' });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
