import { db } from "@/db/client";
import { devOutbox } from "@/db/schema";
import { idFor } from "@/db/ids";
import { email, flags, sms } from "@/lib/env";

/**
 * Outgoing message layer.
 *
 * The transport is honest about its state:
 *   * A real provider (Resend for e-mail, Twilio for SMS) is used only when
 *     credentials are configured.
 *   * Otherwise the message is recorded in the development outbox and the
 *     caller receives `mode: "dev"`. Development messages are never presented
 *     as real deliveries.
 */

export type SendResult = {
  ok: boolean;
  mode: "provider" | "dev";
  providerId?: string;
  error?: string;
};

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  template?: string;
};

export async function sendEmail(input: MailInput): Promise<SendResult> {
  if (email.configured && email.apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${email.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: email.from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          ...(input.html ? { html: input.html } : {}),
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        return { ok: false, mode: "provider", error: `resend_${response.status}: ${detail.slice(0, 200)}` };
      }
      const data = (await response.json()) as { id?: string };
      return { ok: true, mode: "provider", providerId: data.id };
    } catch (error) {
      return { ok: false, mode: "provider", error: (error as Error).message };
    }
  }

  if (flags.devOutboxEnabled) {
    await recordDevMessage({
      channel: "email",
      to: input.to,
      subject: input.subject,
      body: input.text,
      template: input.template,
    });
  }
  return { ok: true, mode: "dev" };
}

export async function sendSms(input: { to: string; body: string; template?: string }): Promise<SendResult> {
  if (sms.configured && sms.accountSid && sms.authToken && sms.fromNumber) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sms.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sms.accountSid}:${sms.authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: input.to, From: sms.fromNumber, Body: input.body }),
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        return { ok: false, mode: "provider", error: `twilio_${response.status}: ${detail.slice(0, 200)}` };
      }
      const data = (await response.json()) as { sid?: string };
      return { ok: true, mode: "provider", providerId: data.sid };
    } catch (error) {
      return { ok: false, mode: "provider", error: (error as Error).message };
    }
  }

  if (flags.devOutboxEnabled) {
    await recordDevMessage({ channel: "sms", to: input.to, body: input.body, template: input.template });
  }
  return { ok: true, mode: "dev" };
}

export async function recordDevMessage(input: {
  channel: "email" | "sms";
  to: string;
  subject?: string;
  body: string;
  template?: string;
}): Promise<void> {
  try {
    await db.insert(devOutbox).values({
      id: idFor.outbox(),
      channel: input.channel,
      to: input.to,
      subject: input.subject ?? null,
      body: input.body,
      template: input.template ?? null,
      createdAt: new Date(),
    });
  } catch {
    // Never break a flow because the development outbox failed.
  }
}
