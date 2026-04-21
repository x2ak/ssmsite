import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';

const LAST_UPDATED = '21 April 2026';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    content: (
      <>
        <p>
          Secure Solutions Midlands Ltd (<strong>"SSM-LTD"</strong>, <strong>"we"</strong>,{' '}
          <strong>"us"</strong>, <strong>"our"</strong>) is the data controller responsible for
          your personal data. We are a cybersecurity and web development agency based in
          Birmingham, United Kingdom.
        </p>
        <p className="mt-4">
          <strong>Contact:</strong>{' '}
          <a href="mailto:contact@ssmltd.co.uk" className="text-primary hover:underline">
            contact@ssmltd.co.uk
          </a>
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: 'Data we collect',
    content: (
      <>
        <p>We collect the following categories of personal data:</p>
        <ul className="mt-4 space-y-3 list-none">
          {[
            {
              label: 'Contact enquiries',
              detail:
                'Your name, email address, and the content of your message when you submit our contact form.',
            },
            {
              label: 'AI chat conversations',
              detail:
                'The messages you type into the assistant on our homepage. These are processed to generate a response and are not stored permanently or linked to your identity.',
            },
            {
              label: 'Usage data',
              detail:
                'Standard server logs including IP address, browser type, and pages visited. These are used solely for security monitoring and are retained for no longer than 30 days.',
            },
            {
              label: 'Cookie preferences',
              detail:
                'Your cookie consent choice is stored locally in your browser (localStorage). No consent data is transmitted to our servers.',
            },
          ].map(({ label, detail }) => (
            <li key={label} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>
                <strong>{label}</strong> — {detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We do not collect payment card data, government-issued ID, or any special category data.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    title: 'How we use your data',
    content: (
      <ul className="space-y-3 list-none">
        {[
          {
            purpose: 'Responding to enquiries',
            basis: 'Legitimate interests (Article 6(1)(f) UK GDPR)',
          },
          {
            purpose: 'Sending you a confirmation email after submitting a contact form',
            basis: 'Legitimate interests',
          },
          {
            purpose: 'Security monitoring and fraud prevention',
            basis: 'Legitimate interests',
          },
          {
            purpose: 'Analytics and site improvement (only if you accepted all cookies)',
            basis: 'Consent (Article 6(1)(a) UK GDPR)',
          },
        ].map(({ purpose, basis }) => (
          <li key={purpose} className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>
              {purpose} — <span className="text-muted-foreground">{basis}</span>
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <>
        <p>We use the following categories of cookies:</p>
        <div className="mt-4 space-y-4">
          {[
            {
              name: 'Strictly necessary',
              always: true,
              description:
                'These cookies are required for the site to function. They include your cookie-consent preference stored in localStorage. These are set regardless of your choice and cannot be disabled.',
            },
            {
              name: 'Analytics',
              always: false,
              description:
                'Set only if you click "Accept all". These help us understand how visitors use the site so we can improve it.',
            },
          ].map(({ name, always, description }) => (
            <div key={name} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                  {name}
                </span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    always
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {always ? 'Always active' : 'Consent required'}
                </span>
              </div>
              <p className="text-sm text-foreground/80">{description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          You can withdraw or change your cookie consent at any time by clearing your browser's
          local storage for this site, or by contacting us.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-party processors',
    content: (
      <>
        <p>
          We share data with the following third parties only where necessary to deliver our
          services. All processors are contractually bound to process data solely on our
          instructions.
        </p>
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Processor
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Purpose
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: 'Resend', purpose: 'Transactional email delivery', location: 'USA (SCCs)' },
                { name: 'Anthropic', purpose: 'AI chat response generation', location: 'USA (SCCs)' },
                { name: 'Replit', purpose: 'Application hosting & infrastructure', location: 'USA (SCCs)' },
              ].map(({ name, purpose, location }) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-medium">{name}</td>
                  <td className="px-4 py-3 text-foreground/80">{purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground">{location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          SCCs = Standard Contractual Clauses (UK International Data Transfer Agreements or
          EU SCCs incorporated by reference), which provide an appropriate safeguard for
          transfers outside the UK/EEA under UK GDPR Article 46.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep your data',
    content: (
      <ul className="space-y-3 list-none">
        {[
          { type: 'Contact form submissions', period: '3 years from last contact, then securely deleted.' },
          { type: 'Server / access logs', period: '30 days, then automatically purged.' },
          { type: 'AI chat messages', period: 'Not retained beyond the immediate request–response cycle.' },
          { type: 'Cookie preference', period: 'Until you clear your browser storage or change your preference.' },
        ].map(({ type, period }) => (
          <li key={type} className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <span>
              <strong>{type}</strong> — {period}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    content: (
      <>
        <p>
          Under UK GDPR you have the following rights. To exercise any of them, email us at{' '}
          <a href="mailto:contact@ssmltd.co.uk" className="text-primary hover:underline">
            contact@ssmltd.co.uk
          </a>
          . We will respond within one calendar month.
        </p>
        <ul className="mt-4 space-y-3 list-none">
          {[
            { right: 'Access', detail: 'Obtain a copy of the personal data we hold about you.' },
            { right: 'Rectification', detail: 'Ask us to correct inaccurate or incomplete data.' },
            { right: 'Erasure', detail: 'Request deletion of your data ("right to be forgotten") where no legal obligation requires us to keep it.' },
            { right: 'Restriction', detail: 'Ask us to stop processing your data while a dispute is resolved.' },
            { right: 'Portability', detail: 'Receive your data in a structured, machine-readable format.' },
            { right: 'Object', detail: 'Object to processing based on legitimate interests. We will stop unless we can demonstrate compelling legitimate grounds.' },
            { right: 'Withdraw consent', detail: 'Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.' },
          ].map(({ right, detail }) => (
            <li key={right} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>
                <strong>{right}</strong> — {detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">
          You also have the right to lodge a complaint with the UK supervisory authority, the
          Information Commissioner&apos;s Office (ICO):{' '}
          <a
            href="https://ico.org.uk/make-a-complaint"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ico.org.uk/make-a-complaint
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <p>
        We apply appropriate technical and organisational measures to protect your data —
        encrypted connections (TLS), least-privilege database access, and regular dependency
        audits. As a cybersecurity firm, security is not a box-tick for us; it is our core
        practice.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        We may update this policy from time to time. We will update the "Last updated" date at
        the top of this page. For material changes we will notify you by email if you have
        previously contacted us. Continued use of the site after a change constitutes acceptance
        of the updated policy.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Legal
          </p>
          <h1
            className="font-syne font-bold text-foreground leading-tight mb-6"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
          >
            Privacy Policy
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 lg:gap-16 items-start">
          {/* Sidebar — table of contents (sticky on desktop) */}
          <motion.nav
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block sticky top-24 self-start"
            aria-label="Table of contents"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              Contents
            </p>
            <ul className="space-y-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-12"
          >
            {SECTIONS.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <h2 className="font-syne font-bold text-xl mb-4">{section.title}</h2>
                <div className="text-foreground/80 leading-relaxed">{section.content}</div>
              </section>
            ))}

            {/* Footer note */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                This policy applies to the website at{' '}
                <a href="https://ssmltd.co.uk" className="text-primary hover:underline">
                  ssmltd.co.uk
                </a>{' '}
                and any associated subdomains operated by Secure Solutions Midlands Ltd.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
