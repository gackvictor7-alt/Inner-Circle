import { sendEmail, sendSms } from "./transport";
import type { Locale } from "@/lib/i18n/dictionaries";

/**
 * Message content (verification codes, password reset, notifications).
 * Every message exists in German and English and uses the recipient's locale.
 */

type Template = {
  subject: (ctx: { code: string }) => string;
  body: (ctx: { code: string; ttlMinutes: number; firstName: string }) => string;
};

const verificationTemplates: Record<Locale, Template> = {
  de: {
    subject: () => "Dein INNER CIRCLE Bestätigungscode",
    body: ({ code, ttlMinutes, firstName }) =>
      `Hallo ${firstName},

dein Bestätigungscode für INNER CIRCLE lautet:

  ${code}

Der Code ist ${ttlMinutes} Minuten gültig. Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.

Zugang schafft Chancen.
Dein INNER CIRCLE Team`,
  },
  en: {
    subject: () => "Your INNER CIRCLE verification code",
    body: ({ code, ttlMinutes, firstName }) =>
      `Hi ${firstName},

your INNER CIRCLE verification code is:

  ${code}

The code is valid for ${ttlMinutes} minutes. If you did not sign up, you can ignore this e-mail.

Access creates opportunity.
Your INNER CIRCLE team`,
  },
};

const resetTemplates: Record<Locale, { subject: string; body: (link: string, firstName: string) => string }> = {
  de: {
    subject: "INNER CIRCLE – Passwort zurücksetzen",
    body: (link, firstName) => `Hallo ${firstName},

du hast ein neues Passwort angefordert. Öffne den folgenden Link, um ein neues Passwort zu vergeben:

${link}

Der Link ist 60 Minuten gültig und kann nur einmal verwendet werden. Falls du das nicht warst, ignoriere diese E-Mail – dein Passwort bleibt unverändert.`,
  },
  en: {
    subject: "INNER CIRCLE – reset your password",
    body: (link, firstName) => `Hi ${firstName},

you requested a new password. Open the link below to choose a new password:

${link}

The link is valid for 60 minutes and can be used once. If this wasn't you, ignore this e-mail – your password stays unchanged.`,
  },
};

export async function sendVerificationCodeEmail(params: {
  to: string;
  code: string;
  firstName: string;
  locale: Locale;
  ttlMinutes: number;
}) {
  const template = verificationTemplates[params.locale];
  return sendEmail({
    to: params.to,
    subject: template.subject({ code: params.code }),
    text: template.body({ code: params.code, ttlMinutes: params.ttlMinutes, firstName: params.firstName }),
    template: "verification_code",
  });
}

export async function sendVerificationCodeSms(params: {
  to: string;
  code: string;
  locale: Locale;
  ttlMinutes: number;
}) {
  const text =
    params.locale === "de"
      ? `INNER CIRCLE Bestätigungscode: ${params.code} (gültig ${params.ttlMinutes} Min.)`
      : `INNER CIRCLE verification code: ${params.code} (valid ${params.ttlMinutes} min)`;
  return sendSms({ to: params.to, body: text, template: "verification_code" });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  link: string;
  firstName: string;
  locale: Locale;
}) {
  const template = resetTemplates[params.locale];
  return sendEmail({
    to: params.to,
    subject: template.subject,
    text: template.body(params.link, params.firstName),
    template: "password_reset",
  });
}
