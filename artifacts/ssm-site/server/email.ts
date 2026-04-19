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

export async function sendEnquiryNotification(inquiry: Inquiry): Promise<void> {
  const resend = getResend();
  const sourceLabel = inquiry.source === 'chat' ? 'AI Chat' : 'Contact Form';

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
            <td>${inquiry.firstName} ${inquiry.lastName}</td>
          </tr>
          <tr>
            <td style="padding:0.5rem 0;font-weight:600;">Email</td>
            <td><a href="mailto:${inquiry.email}">${inquiry.email}</a></td>
          </tr>
          ${inquiry.phone ? `<tr><td style="padding:0.5rem 0;font-weight:600;">Phone</td><td>${inquiry.phone}</td></tr>` : ''}
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
          ${inquiry.message.replace(/\n/g, '<br>')}
        </div>
      </div>
    `,
  });
}

export async function sendEnquiryConfirmation(inquiry: Inquiry): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: inquiry.email,
    subject: `We've received your enquiry — Secure Solutions Midlands`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#0f0f0f;">
        <div style="background:#0a0a0a;padding:2rem;border-radius:8px 8px 0 0;">
          <p style="color:#00c8d7;font-family:monospace;font-size:0.875rem;margin:0 0 0.5rem;">SECURE SOLUTIONS MIDLANDS</p>
          <h1 style="color:#fff;margin:0;font-size:1.75rem;">We've got your message.</h1>
        </div>
        <div style="background:#fff;padding:2rem;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
          <p>Hi ${inquiry.firstName},</p>
          <p>
            Thank you for getting in touch. We've received your enquiry and Zakria will
            personally review it and get back to you within <strong>24 hours</strong>.
          </p>
          <p>Here's a summary of what you sent us:</p>
          <div style="background:#f9f9f9;padding:1rem;border-radius:4px;border-left:4px solid #00c8d7;margin:1rem 0;">
            ${inquiry.message.replace(/\n/g, '<br>')}
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
          © ${new Date().getFullYear()} Secure Solutions Midlands Ltd · Your Vision, Safely Implemented.
        </p>
      </div>
    `,
  });
}
