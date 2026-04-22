import { register, type Adapter } from '../index';

export const sendgridAdapter: Adapter<{ apiKey: string }> = {
  id: 'sendgrid',
  category: 'email',
  configure() {},
  async healthcheck() {
    return { ok: !!process.env.SENDGRID_API_KEY, detail: 'configured via env' };
  },
};
register(sendgridAdapter);

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY not configured');
  const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: { email: process.env.MAIL_FROM ?? 'noreply@gigvora.com' },
      subject: opts.subject,
      content: [{ type: 'text/html', value: opts.html }],
    }),
  });
  if (!r.ok) throw new Error(`sendgrid ${r.status}`);
}
NOT JUST SENDGID ALL ARE AVAILABLE INCLUDING CUSTOM SMTP