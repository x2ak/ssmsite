import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { adminUsers, projects, posts } from '../shared/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PASSWORD = 'changeme123';

async function seed() {
  console.log('Seeding database...');

  // ── Admin user ────────────────────────────────────────────────────────────

  const existingAdmin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, 'zakria'));

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    await db.insert(adminUsers).values({
      username: 'zakria',
      passwordHash,
    });
    console.log('✓ Admin user created (username: zakria)');
    console.warn('⚠  Default password is in use — change it immediately via the admin panel.');
  } else {
    console.log('  Admin user already exists, skipping.');
  }

  // ── Portfolio projects ────────────────────────────────────────────────────

  const existingProjects = await db.select().from(projects);
  if (existingProjects.length === 0) {
    await db.insert(projects).values([
      {
        title: 'E-Commerce Platform Rebuild',
        slug: 'e-commerce-platform-rebuild',
        client: 'Midlands Retail Group',
        description:
          'Full-stack e-commerce platform built with React and Node.js, featuring secure payment integration, inventory management, and a custom CMS.',
        longDescription:
          'Midlands Retail Group needed to replace their outdated WooCommerce setup with something that could scale. We built a bespoke full-stack platform with React on the front end, Node.js and PostgreSQL on the backend, and Stripe for payments. The result: 40% faster load times and a conversion rate increase of 18% in the first quarter.',
        tags: ['Web Dev', 'E-Commerce', 'React', 'Node.js'],
        imageUrl: null,
        liveUrl: null,
        featured: true,
        order: 1,
      },
      {
        title: 'Infrastructure Security Audit',
        slug: 'infrastructure-security-audit',
        client: 'Confidential — Financial Services',
        description:
          'Comprehensive penetration test and security audit of a mid-sized financial services firm, covering network infrastructure, web applications, and employee security practices.',
        longDescription:
          'A financial services client engaged SSM-LTD following a sector-wide advisory about targeted attacks. We conducted a full-scope penetration test — external network, internal infrastructure, and social engineering components. Our report identified 14 critical vulnerabilities, all of which were remediated within 30 days. We then ran a security awareness training programme for their staff.',
        tags: ['Security', 'Penetration Testing', 'Audit'],
        imageUrl: null,
        liveUrl: null,
        featured: true,
        order: 2,
      },
    ]);
    console.log('✓ Portfolio projects seeded');
  } else {
    console.log('  Projects already exist, skipping.');
  }

  // ── Blog posts ────────────────────────────────────────────────────────────

  const existingPosts = await db.select().from(posts);
  if (existingPosts.length === 0) {
    await db.insert(posts).values([
      {
        title: 'Why Most Small Business Websites Are a Security Risk',
        slug: 'why-most-small-business-websites-are-a-security-risk',
        excerpt:
          'Outdated plugins, weak authentication, unencrypted data — most SME websites have at least one critical vulnerability. Here is what to look for and how to fix it.',
        content: `# Why Most Small Business Websites Are a Security Risk

The uncomfortable truth is that most small business websites are not just poorly built — they are actively dangerous. Not in a dramatic, nation-state-hacking sense, but in the quiet, unglamorous way that gets businesses fined by the ICO, loses customer data, and destroys hard-won trust overnight.

## The common culprits

**Outdated software.** WordPress sites running plugins that haven't been updated in two years are the low-hanging fruit of the internet. Automated scanners find them in seconds. The fix is trivial — update your software — but it requires someone who actually cares to own it.

**Weak authentication.** Admin panels with "admin" as the username and a dictionary word as the password. No two-factor authentication. Session tokens that never expire. This is not a hypothetical — it is the baseline for a huge proportion of the sites we audit.

**No TLS on subdomains.** Main domain has HTTPS? Great. But what about the staging environment, the internal tools portal, the old CRM that's still technically live? These become entry points.

**Unencrypted data at rest.** Customer records, payment information, enquiry form submissions — stored in plain text in a database that anyone with the right credentials (or a SQL injection vulnerability) can read.

## What you can do today

1. Run your site through a free scanner (OWASP ZAP, Qualys SSL Labs for your TLS config).
2. Audit your admin credentials. Force a password change. Enable 2FA.
3. Check your plugin and dependency versions. Set up automatic updates where possible.
4. Review who has access to your production environment. Remove anyone who no longer needs it.

If any of that sounds daunting, that is precisely what SSM-LTD is here for. A professional audit takes a day. Recovering from a breach can take months.`,
        published: true,
      },
      {
        title: 'What to Look for in a Web Development Partner (Draft)',
        slug: 'what-to-look-for-in-a-web-development-partner',
        excerpt:
          'Choosing the wrong development partner is expensive and demoralising. Here is a practical checklist for evaluating agencies and freelancers before you commit.',
        content: `# What to Look for in a Web Development Partner

*This post is a draft — not yet published.*

Choosing a development partner is one of the most consequential decisions a business makes. Get it right and you have a long-term technical ally who helps you grow. Get it wrong and you are six months and twenty thousand pounds down with nothing to show for it.

## The questions that matter

- Can they show you real projects with real outcomes — not just pretty screenshots?
- Do they write tests? Can you see their code?
- What happens when something breaks at 2am?
- Who owns the intellectual property once the project is complete?
- How do they handle security? Is it bolted on at the end or designed in from the start?

*More coming soon.*`,
        published: false,
      },
    ]);
    console.log('✓ Blog posts seeded');
  } else {
    console.log('  Posts already exist, skipping.');
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
