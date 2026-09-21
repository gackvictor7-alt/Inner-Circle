import { sendEmail, sendSms } from "./transport";
import type { Locale } from "@/lib/i18n/dictionaries";

/**
 * Message content (verification codes, password reset, notifications).
 * Every message exists in German and English and uses the recipient's locale.
 *
 * Designed with Apple-like minimalism, plenty of whitespace, clear hierarchy,
 * and standard-compliant multipart (HTML + Text) to maximize deliverability.
 */

type VerificationCtx = { code: string; ttlMinutes: number; firstName: string };

function renderVerificationHtml(ctx: VerificationCtx, locale: Locale): string {
  const isDe = locale === "de";
  const title = isDe ? "Bestätige deine E-Mail-Adresse" : "Verify your email address";
  const greeting = isDe ? `Hallo ${ctx.firstName},` : `Hi ${ctx.firstName},`;
  const intro = isDe
    ? "dein Bestätigungscode für INNER CIRCLE lautet:"
    : "your verification code for INNER CIRCLE is:";
  const expiry = isDe
    ? `Der Code ist ${ctx.ttlMinutes} Minuten gültig.`
    : `The code is valid for ${ctx.ttlMinutes} minutes.`;
  const ignoreNotice = isDe
    ? "Wenn du kein INNER-CIRCLE-Konto erstellt hast, kannst du diese Nachricht ignorieren."
    : "If you did not create an INNER CIRCLE account, you can safely ignore this email.";
  const slogan = isDe ? "Zugang schafft Chancen." : "Access creates opportunity.";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INNER CIRCLE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F8FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #10151E;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F7F8FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E3E7ED; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(16, 21, 30, 0.04);">
          <tr>
            <td style="padding: 36px 40px 0 40px;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #366CF5; text-transform: uppercase;">INNER CIRCLE</span>
              <h1 style="margin: 14px 0 0 0; font-size: 24px; font-weight: 700; line-height: 1.3; color: #10151E; letter-spacing: -0.02em;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 0 40px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                ${greeting}
              </p>
              <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                ${intro}
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #F7F8FA; border: 1px solid #E3E7ED; border-radius: 12px; padding: 20px 24px;">
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.3em; color: #10151E; text-indent: 0.3em;">
                      ${ctx.code}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #718096;">
                ${expiry}
              </p>
              <p style="margin: 16px 0 0 0; font-size: 13px; line-height: 1.5; color: #A0AEC0;">
                ${ignoreNotice}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; margin-top: 24px; border-top: 1px solid #F0F2F5;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #718096; letter-spacing: 0.08em; text-transform: uppercase;">
                INNER CIRCLE
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #A0AEC0;">
                ${slogan}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderVerificationText(ctx: VerificationCtx, locale: Locale): string {
  if (locale === "de") {
    return `INNER CIRCLE

Bestätige deine E-Mail-Adresse

Hallo ${ctx.firstName},

dein Bestätigungscode für INNER CIRCLE lautet:

  ${ctx.code}

Der Code ist ${ctx.ttlMinutes} Minuten gültig.

Wenn du kein INNER-CIRCLE-Konto erstellt hast, kannst du diese Nachricht ignorieren.

INNER CIRCLE
Zugang schafft Chancen.`;
  }

  return `INNER CIRCLE

Verify your email address

Hi ${ctx.firstName},

your verification code for INNER CIRCLE is:

  ${ctx.code}

The code is valid for ${ctx.ttlMinutes} minutes.

If you did not sign up for an INNER CIRCLE account, you can safely ignore this email.

INNER CIRCLE
Access creates opportunity.`;
}

function renderPasswordResetHtml(params: { link: string; firstName: string; locale: Locale }): string {
  const isDe = params.locale === "de";
  const title = isDe ? "Passwort zurücksetzen" : "Reset your password";
  const greeting = isDe ? `Hallo ${params.firstName},` : `Hi ${params.firstName},`;
  const intro = isDe
    ? "du hast ein neues Passwort angefordert. Öffne den folgenden Link, um ein neues Passwort zu vergeben:"
    : "you requested a new password. Use the button below to choose a new password:";
  const buttonText = isDe ? "Neues Passwort festlegen" : "Set new password";
  const expiry = isDe
    ? "Der Link ist 60 Minuten gültig und kann nur einmal verwendet werden."
    : "This link is valid for 60 minutes and can be used once.";
  const ignoreNotice = isDe
    ? "Falls du das nicht warst, ignoriere diese E-Mail – dein Passwort bleibt unverändert."
    : "If you did not request this, you can safely ignore this email – your password stays unchanged.";
  const slogan = isDe ? "Zugang schafft Chancen." : "Access creates opportunity.";

  return `<!DOCTYPE html>
<html lang="${params.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INNER CIRCLE</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F8FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #10151E;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F7F8FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E3E7ED; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(16, 21, 30, 0.04);">
          <tr>
            <td style="padding: 36px 40px 0 40px;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #366CF5; text-transform: uppercase;">INNER CIRCLE</span>
              <h1 style="margin: 14px 0 0 0; font-size: 24px; font-weight: 700; line-height: 1.3; color: #10151E; letter-spacing: -0.02em;">
                ${title}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 0 40px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                ${greeting}
              </p>
              <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                ${intro}
              </p>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${params.link}" style="display: inline-block; background-color: #366CF5; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 12px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #718096;">
                ${expiry}
              </p>
              <p style="margin: 16px 0 0 0; font-size: 13px; line-height: 1.5; color: #A0AEC0;">
                ${ignoreNotice}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; margin-top: 24px; border-top: 1px solid #F0F2F5;">
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #718096; letter-spacing: 0.08em; text-transform: uppercase;">
                INNER CIRCLE
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #A0AEC0;">
                ${slogan}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderPasswordResetText(link: string, firstName: string, locale: Locale): string {
  if (locale === "de") {
    return `INNER CIRCLE – Passwort zurücksetzen

Hallo ${firstName},

du hast ein neues Passwort angefordert. Öffne den folgenden Link, um ein neues Passwort zu vergeben:

${link}

Der Link ist 60 Minuten gültig und kann nur einmal verwendet werden. Falls du das nicht warst, ignoriere diese E-Mail – dein Passwort bleibt unverändert.

INNER CIRCLE
Zugang schafft Chancen.`;
  }

  return `INNER CIRCLE – Reset your password

Hi ${firstName},

you requested a new password. Open the link below to choose a new password:

${link}

The link is valid for 60 minutes and can be used once. If this wasn't you, ignore this email – your password stays unchanged.

INNER CIRCLE
Access creates opportunity.`;
}

export async function sendVerificationCodeEmail(params: {
  to: string;
  code: string;
  firstName: string;
  locale: Locale;
  ttlMinutes: number;
}) {
  const subject =
    params.locale === "de"
      ? `Dein INNER CIRCLE Bestätigungscode: ${params.code}`
      : `Your INNER CIRCLE verification code: ${params.code}`;

  const ctx: VerificationCtx = {
    code: params.code,
    ttlMinutes: params.ttlMinutes,
    firstName: params.firstName,
  };

  return sendEmail({
    to: params.to,
    subject,
    text: renderVerificationText(ctx, params.locale),
    html: renderVerificationHtml(ctx, params.locale),
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
  const subject =
    params.locale === "de"
      ? "INNER CIRCLE – Passwort zurücksetzen"
      : "INNER CIRCLE – Reset your password";

  return sendEmail({
    to: params.to,
    subject,
    text: renderPasswordResetText(params.link, params.firstName, params.locale),
    html: renderPasswordResetHtml(params),
    template: "password_reset",
  });
}
