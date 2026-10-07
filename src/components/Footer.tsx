'use client';

import { Mail, Phone, MapPin, Clock, Facebook, Twitter, Linkedin, Instagram, ArrowUp } from 'lucide-react';
import Container from './ui/Container';

const footerLink =
  'text-paper/70 hover:text-paper transition-colors text-left border-b border-transparent hover:border-gold pb-0.5';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSection = (sectionId: string) => {
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const offsetPosition =
          element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    } else {
      localStorage.setItem('scrollToSection', sectionId);
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <footer className="relative overflow-hidden border-t border-gold/50 bg-ink-deep pt-20 pb-10 text-paper">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
      <Container className="relative z-10">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-5 font-serif text-2xl tracking-tight">
              Reverence <span className="italic text-gold">Technology</span>
            </h3>
            <p className="mb-8 max-w-xs leading-relaxed text-paper/65">
              Delivering innovative technology solutions to empower businesses in the digital age.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="text-paper/50 transition-colors hover:text-gold" aria-label="Social link">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/" className={footerLink}>
                  Home
                </a>
              </li>
              <li>
                <button onClick={() => navigateToSection('about')} className={footerLink}>
                  About Us
                </button>
              </li>
              <li>
                <a href="/services" className={footerLink}>
                  Services
                </a>
              </li>
              <li>
                <button onClick={() => navigateToSection('faq')} className={footerLink}>
                  FAQ
                </button>
              </li>
              <li>
                <button onClick={() => navigateToSection('projects')} className={footerLink}>
                  Portfolio
                </button>
              </li>
              <li>
                <a href="/blog" className={footerLink}>
                  Blog
                </a>
              </li>
              <li>
                <a href="/careers" className={footerLink}>
                  Careers
                </a>
              </li>
              <li>
                <button onClick={() => navigateToSection('contact')} className={footerLink}>
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
              Services
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/services" className={footerLink}>
                  All services
                </a>
              </li>
              <li>
                <a href="/services/web-development-uganda" className={footerLink}>
                  Web development
                </a>
              </li>
              <li>
                <a href="/services/mobile-app-development-uganda" className={footerLink}>
                  Mobile apps
                </a>
              </li>
              <li>
                <a href="/services/software-development-uganda" className={footerLink}>
                  Custom software
                </a>
              </li>
              <li>
                <a href="/services/business-automation-uganda" className={footerLink}>
                  Business automation
                </a>
              </li>
              <li>
                <a href="/projects" className={footerLink}>
                  Our projects
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
              Contact
            </h4>
            <ul className="space-y-4 text-paper/70">
              <li className="flex items-start">
                <MapPin className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                Mutungo, Zone 1, Kampala
              </li>
              <li className="flex items-start">
                <Phone className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                <a href="tel:+256783676313" className="hover:text-paper">
                  +256 783 676 313
                </a>
              </li>
              <li className="flex items-start">
                <Mail className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                <a href="mailto:reverencetech1@gmail.com" className="hover:text-paper">
                  reverencetech1@gmail.com
                </a>
              </li>
              <li className="flex items-start">
                <Clock className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                <div>
                  <p>Mon–Fri: 9AM – 5PM</p>
                  <p>Sat–Sun: Closed</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-paper/10 pt-8 md:flex-row">
          <p className="text-sm text-paper/50">
            &copy; {currentYear} Reverence Technology. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-paper/60 transition-colors hover:text-paper"
            >
              Back to top <ArrowUp size={14} />
            </button>
            <a href="/terms#privacy-policy" className="text-paper/50 hover:text-paper">
              Privacy Policy
            </a>
            <a href="/terms" className="text-paper/50 hover:text-paper">
              Terms & Conditions
            </a>
            <a href="/refund-policy" className="text-paper/50 hover:text-paper">
              Refund & Cancellation
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
