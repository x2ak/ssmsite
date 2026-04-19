import { Layout } from '@/components/Layout';
import { ServiceCard } from '@/components/ServiceCard';
import { motion } from 'framer-motion';

const SERVICES = [
  {
    number: '01',
    title: 'Web Development',
    description:
      'Full-stack, secure-by-design websites and web applications built with modern technology. From marketing sites to complex bespoke platforms — we build things that perform, scale, and stand up to scrutiny.',
    specifics: [
      'Custom full-stack web applications (React, TypeScript, Node.js)',
      'Secure-by-design architecture from day one',
      'E-commerce platforms and payment integrations',
      'CMS-driven marketing sites with rapid content workflows',
      'API design and third-party integrations',
      'Performance optimisation and Core Web Vitals',
      'Ongoing support, maintenance, and hosting',
    ],
    href: '/contact',
  },
  {
    number: '02',
    title: 'Network Security & Cyber Defence',
    description:
      'Methodical, thorough security work carried out by people who understand how attackers think. We find the gaps before someone else does — and we help you close them properly.',
    specifics: [
      'External and internal penetration testing',
      'Web application vulnerability assessments',
      'Network infrastructure security audits',
      'Security hardening and remediation guidance',
      'Incident response planning and preparation',
      'Security awareness training for staff',
      'Ongoing vulnerability monitoring',
    ],
    href: '/contact',
  },
  {
    number: '03',
    title: 'Surveillance Systems',
    description:
      'IP-based CCTV installation and remote monitoring systems designed for businesses that need reliable, integrated security infrastructure — not off-the-shelf kits.',
    specifics: [
      'IP CCTV system design and installation',
      'Multi-site unified monitoring solutions',
      'Remote access and mobile monitoring setup',
      'Integration with access control systems',
      'Motion analytics and smart alerting',
      'Encrypted storage and secure data handling',
      'Maintenance, support, and system upgrades',
    ],
    href: '/contact',
  },
];

export default function Services() {
  return (
    <Layout>
      {/* Page header */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            What we do
          </p>
          <h1
            className="font-syne font-bold text-foreground leading-tight max-w-3xl"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Services
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Three areas of deep expertise. Each one carried out properly, with no shortcuts.
          </p>
        </motion.div>
      </section>

      {/* Service sections */}
      {SERVICES.map((service, i) => (
        <ServiceCard key={service.number} {...service} index={i} />
      ))}
    </Layout>
  );
}
