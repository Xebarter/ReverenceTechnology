import { useState } from 'react';
import { Mail, Phone, Send, CheckCircle2, Clock, ShieldCheck, MapPin, FileCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, Inquiry } from '../lib/supabase';
import { Button, Container, FieldLabel, Input, Select, Textarea } from './ui';

export default function Contact() {
  const [formData, setFormData] = useState<Omit<Inquiry, 'id' | 'created_at'>>({
    full_name: '',
    email: '',
    phone_number: '',
    company_name: '',
    interested_package: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const dbPayload = {
        full_name: formData.full_name,
        email: formData.email,
        message: formData.message,
        phone: formData.phone_number,
        company: formData.company_name,
        service_interest: formData.interested_package,
      };

      const { error: submitError } = await supabase
        .from('inquiries')
        .insert([dbPayload]);

      if (submitError) throw submitError;

      const emailPayload = {
        ...formData,
        source: 'contact-form',
        submitted_at: new Date().toISOString(),
      };

      const { error: emailError } = await supabase.functions.invoke('send-inquiry-email', {
        body: emailPayload,
      });

      if (emailError) {
        console.error('Failed to trigger inquiry email notification', emailError);
      }

      setSubmitted(true);
      setFormData({
        full_name: '', email: '', phone_number: '',
        company_name: '', interested_package: '', message: '',
      });
      // Keep success message visible for longer for better UX
      setTimeout(() => setSubmitted(false), 8000);
    } catch (err) {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section id="contact" className="bg-paper py-24">
      <Container>
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">

          {/* Left Column: Context & Trust */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
                Start
              </p>
              <h2 className="mb-6 font-serif text-4xl font-medium tracking-tight text-ink-deep sm:text-5xl">
                Tell us what you need. We’ll reply with a total and a start date.
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-muted">
                Kampala. One business day. Phone if you want an answer faster than email.
              </p>

              <div className="mb-12 space-y-3">
                {[
                  { icon: Clock, title: "Response time", detail: "Within one business day" },
                  { icon: Phone, title: "Call", detail: "+256 783 676 313" },
                  { icon: Mail, title: "Write", detail: "reverencetech1@gmail.com" },
                  { icon: MapPin, title: "Studio", detail: "Mutungo, Zone 1, Kampala, Uganda" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center rounded-xl border border-rule bg-surface p-4 transition-colors duration-300 hover:border-gold/40">
                    <div className="mr-4 text-gold">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">{item.title}</p>
                      <p className="font-medium text-ink">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel-dark relative overflow-hidden p-8 text-paper">
                <ShieldCheck className="absolute -bottom-4 -right-4 text-paper/5" size={160} />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-2 text-gold">
                    <Clock size={18} />
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em]">Availability</span>
                  </div>
                  <h4 className="mb-4 font-serif text-xl font-medium">Desk hours</h4>
                  <div className="mb-6 grid grid-cols-2 gap-4 text-sm text-paper/70">
                    <div>
                      <p className="font-medium text-paper">Mon — Fri</p>
                      <p>8:00 AM - 6:00 PM</p>
                    </div>
                    <div>
                      <p className="font-medium text-paper">Saturday</p>
                      <p>9:00 AM - 2:00 PM</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-paper/15 pt-6 sm:grid-cols-3">
                    <div>
                      <MessageSquare className="mb-2 text-gold" size={18} />
                      <p className="text-xs font-medium leading-relaxed text-paper/80">Reply in one business day</p>
                    </div>
                    <div>
                      <ShieldCheck className="mb-2 text-gold" size={18} />
                      <p className="text-xs font-medium leading-relaxed text-paper/80">No work until you accept the total</p>
                    </div>
                    <div>
                      <FileCheck className="mb-2 text-gold" size={18} />
                      <p className="text-xs font-medium leading-relaxed text-paper/80">You own the code</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: The Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl border border-rule bg-surface p-8 shadow-[0_24px_50px_-36px_rgb(14_36_54/0.45)] md:p-12"
            >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-20 text-center"
                  >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md border border-rule bg-paper text-ink">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="mb-2 font-serif text-3xl font-medium text-ink-deep">Message Received!</h3>
                    <p className="text-lg text-muted">We've received your inquiry and will reach out <br /> within 24 business hours.</p>
                    <Button
                      variant="ghost"
                      onClick={() => setSubmitted(false)}
                      className="mt-8"
                    >
                      Send another message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="h-8 w-px bg-gold" />
                      <h3 className="font-serif text-2xl font-medium text-ink-deep">Get a total</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="contact-full-name">Full Name</FieldLabel>
                        <Input
                          required
                          id="contact-full-name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="E.g. David Okello"
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="contact-email">Work Email</FieldLabel>
                        <Input
                          required
                          type="email"
                          id="contact-email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="david@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="contact-phone">Phone Number</FieldLabel>
                        <Input
                          required
                          type="tel"
                          id="contact-phone"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                          placeholder="+256..."
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="contact-company">Company (Optional)</FieldLabel>
                        <Input
                          id="contact-company"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleChange}
                          placeholder="Your Organization"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel htmlFor="contact-service">Interested Service</FieldLabel>
                      <Select
                        required
                        id="contact-service"
                        name="interested_package"
                        value={formData.interested_package}
                        onChange={handleChange}
                      >
                        <option value="">Select a service category</option>
                        <optgroup label="Web & Software">
                          <option value="Starter Web Package">Starter Web Package</option>
                          <option value="E-Commerce Growth Kit">E-Commerce Growth Kit</option>
                          <option value="Custom Software Bundle">Custom Software Bundle</option>
                        </optgroup>
                        <optgroup label="Enterprise">
                          <option value="Cyber Security Shield">Cyber Security Shield</option>
                          <option value="Cloud Migration Pro">Cloud Migration Pro</option>
                          <option value="AI Integration">AI Integration & Automation</option>
                        </optgroup>
                        <option value="General Inquiry">General Inquiry</option>
                      </Select>
                    </div>

                    <div>
                      <FieldLabel htmlFor="contact-message">Your Message</FieldLabel>
                      <Textarea
                        required
                        id="contact-message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        placeholder="What should we build, and when do you need it?"
                        className="resize-none"
                      />
                    </div>

                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium text-red-600">
                        {error}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting}
                      size="lg"
                      className="w-full"
                    >
                      {submitting ? "Sending…" : "Request a quote"}
                      <Send size={18} />
                    </Button>

                    <p className="text-center text-xs text-muted">
                      By submitting, you agree to our privacy policy and terms of service.
                    </p>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
