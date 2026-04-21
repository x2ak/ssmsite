import { Resend } from 'resend';
import type { Inquiry } from '../shared/schema';

const FROM_ADDRESS = 'noreply@support.ssmltd.co.uk';
const ADMIN_EMAIL = 'contact@ssmltd.co.uk';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set — email sending is disabled');
  }
  return new Resend(key);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function escapeMessage(str: string): string {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

function safeMailto(email: string): string {
  const safe = encodeURIComponent(email.replace(/[^a-zA-Z0-9._%+\-@]/g, ''));
  return `mailto:${safe}`;
}

export async function sendEnquiryNotification(inquiry: Inquiry): Promise<void> {
  const resend = getResend();
  const sourceLabel = inquiry.source === 'chat' ? 'AI Chat' : 'Contact Form';
  const firstName = escapeHtml(inquiry.firstName);
  const lastName = escapeHtml(inquiry.lastName);
  const email = escapeHtml(inquiry.email);
  const phone = inquiry.phone ? escapeHtml(inquiry.phone) : null;
  const message = escapeMessage(inquiry.message);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject: `New Enquiry from ${inquiry.firstName} ${inquiry.lastName} [${sourceLabel}]`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#00c8d7;border-bottom:2px solid #00c8d7;padding-bottom:0.5rem;">
          New Enquiry — SSM-LTD
        </h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:0.5rem 0;font-weight:600;width:140px;">Name</td>
            <td>${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding:0.5rem 0;font-weight:600;">Email</td>
            <td><a href="${safeMailto(inquiry.email)}">${email}</a></td>
          </tr>
          ${phone ? `<tr><td style="padding:0.5rem 0;font-weight:600;">Phone</td><td>${phone}</td></tr>` : ''}
          <tr>
            <td style="padding:0.5rem 0;font-weight:600;">Source</td>
            <td>${sourceLabel}</td>
          </tr>
          <tr>
            <td style="padding:0.5rem 0;font-weight:600;">Date</td>
            <td>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        </table>
        <h3 style="margin-top:1.5rem;">Message</h3>
        <div style="background:#f5f5f5;padding:1rem;border-radius:4px;border-left:4px solid #00c8d7;">
          ${message}
        </div>
      </div>
    `,
  });
}

export async function sendEnquiryReply(inquiry: Inquiry, body: string): Promise<void> {
  const resend = getResend();
  const firstName = escapeHtml(inquiry.firstName);
  const replyBody = escapeMessage(body);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: inquiry.email,
    replyTo: ADMIN_EMAIL,
    subject: `Re: Your enquiry with Secure Solutions Midlands`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#0f0f0f;">
        <div style="background:#0a0a0a;padding:2rem;border-radius:8px 8px 0 0;">
          <p style="color:#00c8d7;font-family:monospace;font-size:0.875rem;margin:0 0 0.5rem;">SECURE SOLUTIONS MIDLANDS</p>
          <h1 style="color:#fff;margin:0;font-size:1.5rem;">Re: Your enquiry</h1>
        </div>
        <div style="background:#fff;padding:2rem;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
          <p>Hi ${firstName},</p>
          <div style="margin:1.5rem 0;white-space:pre-wrap;">${replyBody}</div>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:1.5rem 0;">
          <p style="margin:0;color:#555;font-size:0.9rem;">
            <strong>Zakria</strong><br>
            Secure Solutions Midlands<br>
            <a href="mailto:contact@ssmltd.co.uk" style="color:#00c8d7;">contact@ssmltd.co.uk</a>
          </p>
        </div>
        <p style="text-align:center;font-size:0.75rem;color:#999;margin-top:1rem;">
          &copy; ${new Date().getFullYear()} Secure Solutions Midlands Ltd
        </p>
      </div>
    `,
  });
}

export async function sendEnquiryConfirmation(inquiry: Inquiry): Promise<void> {
  const resend = getResend();
  const firstName = escapeHtml(inquiry.firstName);
  const message = escapeMessage(inquiry.message);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: inquiry.email,
    subject: `We've received your enquiry — Secure Solutions Midlands`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#0f0f0f;">
        <div style="background:#0a0a0a;padding:2rem;border-radius:8px 8px 0 0;">
          <p style="color:#00c8d7;font-family:monospace;font-size:0.875rem;margin:0 0 0.5rem;">SECURE SOLUTIONS MIDLANDS</p>
          <h1 style="color:#fff;margin:0;font-size:1.75rem;">We&#x27;ve got your message.</h1>
        </div>
        <div style="background:#fff;padding:2rem;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
          <p>Hi ${firstName},</p>
          <p>
            Thank you for getting in touch. We&#x27;ve received your enquiry and Zakria will
            personally review it and get back to you within <strong>24 hours</strong>.
          </p>
          <p>Here&#x27;s a summary of what you sent us:</p>
          <div style="background:#f9f9f9;padding:1rem;border-radius:4px;border-left:4px solid #00c8d7;margin:1rem 0;">
            ${message}
          </div>
          <p>
            In the meantime, if you have anything urgent, you can reach us directly at
            <a href="mailto:contact@ssmltd.co.uk" style="color:#00c8d7;">contact@ssmltd.co.uk</a>.
          </p>
          <p style="margin-top:2rem;">
            Regards,<br>
            <strong>Zakria</strong><br>
            Secure Solutions Midlands
          </p>
        </div>
        <p style="text-align:center;font-size:0.75rem;color:#999;margin-top:1rem;">
          &copy; ${new Date().getFullYear()} Secure Solutions Midlands Ltd &middot; Your Vision, Safely Implemented.
        </p>
      </div>
    `,
  });
}
