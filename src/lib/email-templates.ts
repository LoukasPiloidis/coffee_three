type Locale = "en" | "el";

interface TemplateParams {
  url: string;
  locale: Locale;
}

interface EmailContent {
  subject: string;
  html: string;
}

const copy = {
  verification: {
    en: {
      subject: "Verify your email — Coffee Three",
      heading: "Verify your email",
      body: "Click the button below to verify your email address and activate your account.",
      cta: "Verify email",
      footer: "If you didn't create an account, you can safely ignore this email.",
    },
    el: {
      subject: "Επιβεβαίωση email — Coffee Three",
      heading: "Επιβεβαιώστε το email σας",
      body: "Πατήστε το κουμπί παρακάτω για να επιβεβαιώσετε το email σας και να ενεργοποιήσετε τον λογαριασμό σας.",
      cta: "Επιβεβαίωση email",
      footer: "Αν δεν δημιουργήσατε λογαριασμό, μπορείτε να αγνοήσετε αυτό το μήνυμα.",
    },
  },
  resetPassword: {
    en: {
      subject: "Reset your password — Coffee Three",
      heading: "Reset your password",
      body: "Click the button below to set a new password. This link expires in 1 hour.",
      cta: "Reset password",
      footer: "If you didn't request a password reset, you can safely ignore this email.",
    },
    el: {
      subject: "Επαναφορά κωδικού — Coffee Three",
      heading: "Επαναφορά κωδικού",
      body: "Πατήστε το κουμπί παρακάτω για να ορίσετε νέο κωδικό. Ο σύνδεσμος λήγει σε 1 ώρα.",
      cta: "Επαναφορά κωδικού",
      footer: "Αν δεν ζητήσατε επαναφορά κωδικού, μπορείτε να αγνοήσετε αυτό το μήνυμα.",
    },
  },
};

function renderEmail(t: (typeof copy.verification)["en"], url: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f5f1eb;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="420" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:32px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:22px;color:#1a3c34;">${t.heading}</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.5;">${t.body}</p>
          <a href="${url}" style="display:inline-block;padding:12px 28px;background:#1a3c34;color:#fff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:500;">${t.cta}</a>
          <p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.4;">${t.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function verificationEmail({ url, locale }: TemplateParams): EmailContent {
  const t = copy.verification[locale];
  return { subject: t.subject, html: renderEmail(t, url) };
}

export function resetPasswordEmail({ url, locale }: TemplateParams): EmailContent {
  const t = copy.resetPassword[locale];
  return { subject: t.subject, html: renderEmail(t, url) };
}
