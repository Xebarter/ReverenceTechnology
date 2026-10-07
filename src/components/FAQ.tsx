import { useState } from 'react';
import {
  HelpCircle, MessageCircle, ShieldCheck, Zap,
  Clock, ChevronDown, Code2, Scale, Phone
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import FAQSchema from './FAQSchema';
import { Button, Container, FieldLabel, Input } from './ui';

const faqs = [
  {
    category: 'Starting',
    icon: Zap,
    items: [
      {
        question: 'How fast do you start?',
        answer:
          'We reply within one business day with a total and a start date. Most projects begin the same week you accept the quote.',
      },
      {
        question: 'What does a quote include?',
        answer:
          'One number for the agreed scope: design, build, and launch. Extra work is priced before we start it. No open-ended retainer unless you ask for one.',
      },
    ],
  },
  {
    category: 'Money',
    icon: Scale,
    items: [
      {
        question: 'How do installments work?',
        answer:
          'We set an agreed total. You pay when we request an installment, or settle the remaining balance in full at any time from your project page.',
      },
      {
        question: 'Can I pay with MTN, Airtel, or a card?',
        answer:
          'Yes. Mobile money sends a PIN prompt to your MTN or Airtel number. Cards open a secure payment page. Use the number on checkout or on your project.',
      },
    ],
  },
  {
    category: 'Ownership',
    icon: Code2,
    items: [
      {
        question: 'Who owns the code?',
        answer:
          'You do. When the project is complete, the source, assets, and documentation transfer to you. We do not keep a license on your product.',
      },
    ],
  },
];

const quickFacts = [
  { icon: Clock, title: 'Reply', desc: 'One business day.' },
  { icon: ShieldCheck, title: 'Payments', desc: 'Mobile money or card.' },
];

export default function FAQ() {
  const [activeId, setActiveId] = useState<string | null>("0-0");
  const [showCallForm, setShowCallForm] = useState(false);
  const [callForm, setCallForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    preferredDate: '',
    preferredTime: '',
    callReason: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleCallFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    try {
      const { error } = await supabase
        .from('scheduled_calls')
        .insert([{
          full_name: callForm.fullName,
          email: callForm.email,
          phone: callForm.phone,
          company: callForm.company,
          preferred_date: callForm.preferredDate ? new Date(callForm.preferredDate).toISOString() : null,
          preferred_time: callForm.preferredTime,
          call_reason: callForm.callReason || 'General FAQ inquiry'
        }]);

      if (error) {
        throw new Error(error.message);
      }

      setFormStatus('success');
      // Reset form after successful submission
      setCallForm({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        preferredDate: '',
        preferredTime: '',
        callReason: ''
      });
      // Hide form after 3 seconds
      setTimeout(() => {
        setShowCallForm(false);
        setFormStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error submitting call request:', err);
      setFormStatus('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCallForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Flatten all FAQ items for schema
  const allFaqItems = faqs.flatMap(category =>
    category.items.map(item => ({
      question: item.question,
      answer: item.answer
    }))
  );

  const scheduleFormFields = (
    <>
      <div>
        <FieldLabel htmlFor="faq-fullName" className="text-paper/55">Full Name *</FieldLabel>
        <Input
          type="text"
          id="faq-fullName"
          name="fullName"
          value={callForm.fullName}
          onChange={handleInputChange}
          required
          placeholder="John Doe"
        />
      </div>
      <div>
        <FieldLabel htmlFor="faq-email" className="text-paper/55">Email *</FieldLabel>
        <Input
          type="email"
          id="faq-email"
          name="email"
          value={callForm.email}
          onChange={handleInputChange}
          required
          placeholder="john@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="faq-phone" className="text-paper/55">Phone</FieldLabel>
          <Input
            type="tel"
            id="faq-phone"
            name="phone"
            value={callForm.phone}
            onChange={handleInputChange}
            placeholder="+1234567890"
          />
        </div>
        <div>
          <FieldLabel htmlFor="faq-company" className="text-paper/55">Company</FieldLabel>
          <Input
            type="text"
            id="faq-company"
            name="company"
            value={callForm.company}
            onChange={handleInputChange}
            placeholder="Your company"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="faq-preferredDate" className="text-paper/55">Preferred Date</FieldLabel>
          <Input
            type="date"
            id="faq-preferredDate"
            name="preferredDate"
            value={callForm.preferredDate}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <FieldLabel htmlFor="faq-preferredTime" className="text-paper/55">Preferred Time</FieldLabel>
          <Input
            type="time"
            id="faq-preferredTime"
            name="preferredTime"
            value={callForm.preferredTime}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="faq-callReason" className="text-paper/55">Reason for Call</FieldLabel>
        <Input
          type="text"
          id="faq-callReason"
          name="callReason"
          value={callForm.callReason}
          onChange={handleInputChange}
          placeholder="Specific question or topic"
        />
      </div>
    </>
  );

  const mobileScheduleFormFields = (
    <>
      <div>
        <FieldLabel htmlFor="faq-fullName-mobile">Full Name *</FieldLabel>
        <Input
          type="text"
          id="faq-fullName-mobile"
          name="fullName"
          value={callForm.fullName}
          onChange={handleInputChange}
          required
          placeholder="John Doe"
        />
      </div>
      <div>
        <FieldLabel htmlFor="faq-email-mobile">Email *</FieldLabel>
        <Input
          type="email"
          id="faq-email-mobile"
          name="email"
          value={callForm.email}
          onChange={handleInputChange}
          required
          placeholder="john@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="faq-phone-mobile">Phone</FieldLabel>
          <Input
            type="tel"
            id="faq-phone-mobile"
            name="phone"
            value={callForm.phone}
            onChange={handleInputChange}
            placeholder="+1234567890"
          />
        </div>
        <div>
          <FieldLabel htmlFor="faq-company-mobile">Company</FieldLabel>
          <Input
            type="text"
            id="faq-company-mobile"
            name="company"
            value={callForm.company}
            onChange={handleInputChange}
            placeholder="Your company"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="faq-preferredDate-mobile">Preferred Date</FieldLabel>
          <Input
            type="date"
            id="faq-preferredDate-mobile"
            name="preferredDate"
            value={callForm.preferredDate}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <FieldLabel htmlFor="faq-preferredTime-mobile">Preferred Time</FieldLabel>
          <Input
            type="time"
            id="faq-preferredTime-mobile"
            name="preferredTime"
            value={callForm.preferredTime}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="faq-callReason-mobile">Reason for Call</FieldLabel>
        <Input
          type="text"
          id="faq-callReason-mobile"
          name="callReason"
          value={callForm.callReason}
          onChange={handleInputChange}
          placeholder="Specific question or topic"
        />
      </div>
    </>
  );

  return (
    <>
      <FAQSchema faqs={allFaqItems} />
      <section id="faq" className="bg-paper py-20 md:py-32">
        <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">

        {/* Left Side: Text and Stats */}
        <div className="lg:col-span-5 space-y-10">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
              <HelpCircle size={13} /> Questions
            </p>
            <h2 className="mb-6 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-ink-deep md:text-6xl">
              The questions that decide the buy.
            </h2>
            <p className="max-w-md text-lg text-muted">
              Timeline, money, and who owns what. If it is not here, book a call.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {quickFacts.map((fact, i) => (
              <div key={i} className="flex items-center gap-4 rounded-md border border-rule bg-surface p-5">
                <div className="text-gold"><fact.icon size={20} /></div>
                <div>
                  <h4 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">{fact.title}</h4>
                  <p className="font-medium text-ink">{fact.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="panel-dark relative hidden overflow-hidden p-8 text-paper md:block">
            {showCallForm ? (
              <div className="relative z-10">
                <h3 className="mb-6 font-serif text-2xl font-medium">Schedule a Call</h3>
                {formStatus === 'success' ? (
                  <div className="py-6 text-center">
                    <p className="mb-4 text-gold">Request submitted successfully!</p>
                    <p className="text-paper/70">We'll contact you soon to confirm your appointment.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCallFormSubmit} className="space-y-4">
                    {scheduleFormFields}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={formStatus === 'submitting'}
                        className="flex-1 border-paper bg-paper text-ink-deep hover:bg-surface"
                      >
                        {formStatus === 'submitting' ? 'Submitting...' : 'Schedule Call'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowCallForm(false)}
                        className="border-paper/30 text-paper hover:border-paper hover:bg-paper/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <>
                <MessageCircle className="absolute -bottom-8 -right-8 text-paper/5" size={160} />
                <h3 className="mb-2 font-serif text-2xl font-medium">Want a number?</h3>
                <p className="mb-6 text-sm text-paper/70">Fifteen minutes. We tell you if we can do it and what it costs.</p>
                <Button
                  onClick={() => setShowCallForm(true)}
                  className="w-full border-paper bg-paper text-ink-deep hover:bg-surface"
                >
                  <Phone size={18} /> Schedule Call
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Accordion */}
        <div className="lg:col-span-7 space-y-10">
          {faqs.map((group, gIdx) => (
            <div key={gIdx}>
              <h3 className="mb-1 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
                <group.icon size={14} className="text-gold" /> {group.category}
              </h3>
              <div className="border-t border-rule">
                {group.items.map((item, iIdx) => {
                  const id = `${gIdx}-${iIdx}`;
                  const isOpen = activeId === id;
                  return (
                    <div key={id} className="border-b border-rule">
                      <button
                        onClick={() => setActiveId(isOpen ? null : id)}
                        className="flex w-full items-center justify-between py-5 text-left transition-colors duration-300"
                      >
                        <span className={`pr-4 font-serif text-lg transition-colors duration-300 ${isOpen ? 'text-ink' : 'text-ink-deep'}`}>{item.question}</span>
                        <ChevronDown size={18} className={`shrink-0 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-gold' : 'text-muted'}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="pb-6 leading-relaxed text-muted">
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="md:hidden">
            {showCallForm ? (
              <div className="rounded-md border border-rule bg-surface p-6">
                <h3 className="mb-4 flex items-center gap-2 font-serif text-xl text-ink-deep">
                  <Phone size={20} /> Schedule a Call
                </h3>
                {formStatus === 'success' ? (
                  <div className="py-4 text-center">
                    <p className="mb-2 font-medium text-ink">Request submitted successfully!</p>
                    <p className="text-muted">We'll contact you soon to confirm your appointment.</p>
                  </div>
                ) : (
                  <form onSubmit={handleCallFormSubmit} className="space-y-4">
                    {mobileScheduleFormFields}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={formStatus === 'submitting'}
                        className="flex-1"
                      >
                        {formStatus === 'submitting' ? 'Submitting...' : 'Schedule Call'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowCallForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setShowCallForm(true)}
                className="w-full"
                size="lg"
              >
                <Phone size={18} /> Talk to an Expert
              </Button>
            )}
          </div>
        </div>
        </div>
        </Container>
      </section>
    </>
  );
}
