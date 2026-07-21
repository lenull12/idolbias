let _auth: any = null;

export async function getAuth() {
  if (_auth) return _auth;

  let env: Record<string, string>;
  try {
    const ctx = require("@opennextjs/cloudflare").getCloudflareContext();
    env = ctx.env;
  } catch {
    env = process.env as Record<string, string>;
  }

  const { betterAuth } = await import("better-auth");
  const { drizzleAdapter } = await import("better-auth/adapters/drizzle");
  const { getDb } = await import("@/db/client");
  const schema = await import("@/db/schema");

  const socialProviders: Record<string, any> = {};
  if (env.GOOGLE_CLIENT_ID) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      prompt: "select_account",
    } as any;
  }


  _auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL ?? "http://localhost:8787",
    secret: env.BETTER_AUTH_SECRET ?? "dev-secret-change-in-production",
    database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
    socialProviders,
    emailAndPassword: {
      enabled: true,
      async sendVerificationEmail(_data: { user: any; url: string }) {
        // Optionnel — la vérification par défaut de Better Auth suffit
      },
      async sendResetPassword(data: { user: any; url: string; token: string }) {
        const { Resend } = await import("resend");
        const resend = new Resend(env.RESEND_API_KEY);
        const base = env.BETTER_AUTH_URL ?? "https://idolbias.com";
        const resetUrl = `${base}/reset-password/${data.token}`;
        await resend.emails.send({
          from: "IdolBias <noreply@idolbias.com>",
          to: data.user.email,
          subject: "Reset your IdolBias password",
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3ecf0;font-family:Inter,system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:2px solid #0f0712;box-shadow:5px 5px 0px #0f0712;">
<tr><td align="center" style="padding:32px 32px 0;">
<span style="font-family:Unbounded,system-ui,sans-serif;font-size:28px;font-weight:900;background:linear-gradient(100deg,#FF1493,#C9B1FF,#9EE6FF);-webkit-background-clip:text;background-clip:text;color:transparent;">IdolBias</span>
</td></tr>
<tr><td style="padding:24px 32px 32px;">
<h1 style="font-family:Unbounded,system-ui,sans-serif;font-size:20px;font-weight:900;color:#0f0712;margin:0 0 8px;">Password reset</h1>
<p style="font-size:14px;color:#0f0712a6;line-height:1.5;margin:0 0 24px;">Someone requested a password reset for your IdolBias account. Click the button below to set a new password.</p>
<table cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:10px;background:linear-gradient(135deg,#FF1493,#C9B1FF);padding:12px 32px;">
<a href="${resetUrl}" style="font-family:Unbounded,system-ui,sans-serif;font-size:14px;font-weight:700;color:#0f0712;text-decoration:none;letter-spacing:0.5px;">RESET PASSWORD</a>
</td></tr></table>
<p style="font-size:12px;color:#0f071280;line-height:1.5;margin:24px 0 0;">If you didn't request this, you can safely ignore this email. The link expires in 1 hour.</p>
</td></tr>
<tr><td style="padding:0 32px 24px;text-align:center;"><span style="font-size:10px;color:#0f07124d;letter-spacing:2px;text-transform:uppercase;">IdolBias — Where idols come to life</span></td></tr>
</table></td></tr></table>
</body></html>`,
        });
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "cf-connecting-ip"],
        trustedProxies: ["::1", "127.0.0.1"],
      },
    },
    allowedHosts: ["idolbias.com", "idolbias.raphitran.workers.dev", "localhost"],
  });

  return _auth;
}
