import 'server-only';

import { db } from '@/lib/db';
import { devOtpLog } from '@/db/schema';

export type OtpLogInput = {
  channel: 'email' | 'phone';
  destination: string;
  otp: string;
  meta?: string;
};

export async function logDevOtp(input: OtpLogInput): Promise<void> {
  try {
    await db.insert(devOtpLog).values({
      channel: input.channel,
      destination: input.destination,
      otp: input.otp,
      meta: input.meta ?? null,
    });
  } catch (e) {
    console.warn('[otpLog] failed to persist dev OTP (table missing?)', e);
  }
}
