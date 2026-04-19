import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  number: string;
  title: string;
  description: string;
  specifics: string[];
  href: string;
  index: number;
}

export function ServiceCard({
  number,
  title,
  description,
  specifics,
  href,
  index,
}: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="min-h-screen flex items-center py-24 border-b border-border last:border-0"
    >
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="font-mono text-7xl font-bold text-muted/60 leading-none mb-6 select-none">
            {number}
          </p>
          <h2
            className="text-4xl md:text-5xl font-syne font-bold text-foreground mb-6"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-prose">
            {description}
          </p>
          <Link href={href}>
            <span className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all cursor-pointer group">
              Discuss this service
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
        <div>
          <ul className="space-y-3">
            {specifics.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
