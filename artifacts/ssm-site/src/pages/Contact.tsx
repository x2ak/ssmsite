import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { CheckCircle, Mail, MapPin, Clock } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  service: z.string().min(1, 'Please select a service'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactFormData) {
    setServerError(null);
    try {
      await apiRequest('POST', '/api/inquiries', {
        ...data,
        message: `[Service: ${data.service}]\n\n${data.message}`,
      });
      setSubmitted(true);
    } catch (err) {
      setServerError(
        (err as Error).message || 'Something went wrong. Please try again or email us directly.'
      );
    }
  }

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Get in touch
          </p>
          <h1
            className="font-syne font-bold text-foreground leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Contact Us
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left — contact details */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              Tell us about your project or challenge. We'll get back to you within 24 hours to discuss whether we're the right fit.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <Mail size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-0.5">Email</p>
                  <a
                    href="mailto:contact@ssmltd.co.uk"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    contact@ssmltd.co.uk
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-0.5">Location</p>
                  <p className="text-sm text-muted-foreground">Midlands, United Kingdom</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Clock size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-0.5">Response time</p>
                  <p className="text-sm text-muted-foreground">Within 24 hours, guaranteed</p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4">
                <CheckCircle size={40} className="text-primary" />
                <h2 className="font-syne font-bold text-2xl text-foreground">Message received.</h2>
                <p className="text-muted-foreground max-w-sm">
                  Thank you for reaching out. Zakria will review your message and respond within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="Jane"
                      aria-invalid={!!errors.firstName}
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      aria-invalid={!!errors.lastName}
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@company.co.uk"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Phone number{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 7700 000000"
                    {...register('phone')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="service">Service interest</Label>
                  <Select
                    id="service"
                    aria-invalid={!!errors.service}
                    defaultValue=""
                    {...register('service')}
                  >
                    <option value="" disabled>
                      Select a service…
                    </option>
                    <option value="Web Development">Web Development</option>
                    <option value="Cybersecurity">Network Security &amp; Cyber Defence</option>
                    <option value="Other">Other / Not sure yet</option>
                  </Select>
                  {errors.service && (
                    <p className="text-xs text-destructive">{errors.service.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Your message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your project, challenge, or question…"
                    rows={5}
                    aria-invalid={!!errors.message}
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-xs text-destructive">{errors.message.message}</p>
                  )}
                </div>

                {serverError && (
                  <p className="text-sm text-destructive">{serverError}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Sending…' : 'Send Message'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  We'll respond within 24 hours. Your details are kept confidential.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
