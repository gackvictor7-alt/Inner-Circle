import { db } from "@/db/client";
import { devOutbox } from "@/db/schema";
import { idFor } from "@/db/ids";
import { devOutboxAccepts, email, sms, type DeliveryMode } from "@/lib/env";

/**
 * Outgoing message layer.
 *
 * The transport is honest about its state:
 *   * A real provider (Resend for e-mail, Twilio for SMS) is used only when
 *     credentials are configured.
 *   * Otherwise the message is recorded in the development outbox and the
 *     caller receives `mode: "dev"`. Development messages are never presented
 *     as real deliveries.
 *   * When neither exists (production without provider, or a recipient outside
 *     `DEV_OUTBOX_RECIPIENTS`) the result is `ok: false, mode: "none"`. A
 *     message that reaches nobody is never reported as sent – that silent loss
 *     is exactly what blocked verification on the first deployment.
 */

export type SendResult = {
  ok: boolean;
  mode: DeliveryMode;
  providerId?: string;
  error?: "no_delivery_channel" | "outbox_write_failed" | string;
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
          ...(email.replyTo ? { reply_to: email.replyTo } : {}),
          headers: {
            "X-Entity-Ref-ID": idFor.outbox(),
          },
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

  return recordOrRefuse({
    channel: "email",
    to: input.to,
    subject: input.subject,
    body: input.text,
    template: input.template,
  });
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

  return recordOrRefuse({ channel: "sms", to: input.to, body: input.body, template: input.template });
}

type DevMessage = {
  channel: "email" | "sms";
  to: string;
  subject?: string;
  body: string;
  template?: string;
};

/** No provider: record in the dev outbox when allowed, otherwise refuse honestly. */
async function recordOrRefuse(message: DevMessage): Promise<SendResult> {
  if (!devOutboxAccepts(message.to)) {
    return { ok: false, mode: "none", error: "no_delivery_channel" };
  }
  const recorded = await recordDevMessage(message);
  if (!recorded) return { ok: false, mode: "none", error: "outbox_write_failed" };
  return { ok: true, mode: "dev" };
}

/** Stores a message in the development outbox. Returns false when it could not be stored. */
export async function recordDevMessage(input: DevMessage): Promise<boolean> {
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
    return true;
  } catch {
    // Never break a flow because the development outbox failed – but never
    // claim the message is readable somewhere either.
    return false;
  }
}
