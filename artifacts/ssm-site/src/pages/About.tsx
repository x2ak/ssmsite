import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Link } from 'wouter';

const VALUES = [
  {
    title: 'Substance over style',
    description:
      'We do not chase trends. Every decision — in design, in code, in security methodology — is made because it produces the best outcome for the client.',
  },
  {
    title: 'Security is not optional',
    description:
      'We build security in from the start. It is not a phase at the end of a project. It is not a checkbox. It is a discipline that runs through everything we do.',
  },
  {
    title: 'Honest about scope',
    description:
      'We tell clients what a project actually needs, not what they want to hear. If something is going to be complex, we say so upfront.',
  },
  {
    title: 'Long-term thinking',
    description:
      'We build things that are maintainable, documented, and designed to last. We would rather take longer and do it properly than ship fast and create technical debt.',
  },
];

const STATS = [
  { value: '5+', label: 'Years operating' },
  { value: '40+', label: 'Projects delivered' },
  { value: '24h', label: 'Response time SLA' },
  { value: '100%', label: 'UK-based team' },
];

export default function About() {
  return (
    <Layout>
      {/* Mission */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-24"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
            About SSM-LTD
          </p>
          <h1
            className="font-syne font-bold text-foreground leading-tight mb-16"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
          >
            Your Vision,<br />Safely Implemented.
          </h1>

          {/* Two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left — written content */}
            <div className="space-y-5 text-foreground/80 leading-relaxed">
              <p className="text-lg">
                Secure Solutions Midlands was founded on a straightforward premise: businesses deserve digital infrastructure that is both well-built and genuinely secure. Too often, they get one or the other.
              </p>
              <p>
                We are a specialist firm based in the Midlands, UK. Our work spans web development and cybersecurity — two disciplines that, in practice, are deeply interconnected. A well-built website means nothing if the infrastructure behind it is exposed.
              </p>
              <p>
                We work with businesses of all sizes: from growing SMEs who need their first proper web presence, to established organisations that need a rigorous security audit before a critical deadline. What connects all our clients is that they take their digital infrastructure seriously.
              </p>
              <p>
                Zakria leads the firm and is the primary point of contact for every engagement. There are no account managers here — when you work with SSM-LTD, you work directly with the people doing the work.
              </p>
              <div className="pt-4">
                <Link href="/contact">
                  <span className="inline-flex items-center gap-2 text-primary font-medium hover:underline cursor-pointer">
                    Start a conversation →
                  </span>
                </Link>
              </div>
            </div>

            {/* Right — stats */}
            <div className="grid grid-cols-2 gap-6">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-[var(--radius)] border border-border bg-card"
                >
                  <p
                    className="font-syne font-bold text-primary mb-1"
                    style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Values */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              How we work
            </p>
            <h2
              className="font-syne font-bold text-foreground"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
            >
              Our values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-6 rounded-[var(--radius)] border border-border bg-card"
              >
                <h3 className="font-syne font-bold text-lg text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
