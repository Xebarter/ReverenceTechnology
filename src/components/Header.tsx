'use client';

import { Menu, X, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, buttonClassName, Container } from './ui';
import AccountMenu from './AccountMenu';

const navLinkClass =
  'relative text-sm tracking-wide text-ink hover:text-ink-deep transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const scrollToSection = () => {
      const storedSectionId = localStorage.getItem('scrollToSection');
      if (storedSectionId) {
        localStorage.removeItem('scrollToSection');
        attemptScroll(storedSectionId);
        return;
      }

      const hash = window.location.hash;
      if (hash) {
        attemptScroll(hash.substring(1));
      }
    };

    const attemptScroll = (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) {
        scrollToElement(element);
      } else {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) scrollToElement(el);
        }, 500);
      }
    };

    const scrollToElement = (element: HTMLElement) => {
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      const offsetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    };

    if (pathname === '/') {
      scrollToSection();
    }
  }, [pathname]);

  const navigateToSection = (sectionId: string) => {
    const scrollToElement = (element: HTMLElement) => {
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      const offsetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    };

    if (pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) scrollToElement(element);
      setIsMenuOpen(false);
    } else {
      localStorage.setItem('scrollToSection', sectionId);
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-sm">
        <Container>
          <nav className="flex h-[4.25rem] items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Reverence Technology" className="h-8 w-auto" />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg text-ink-deep tracking-tight">Reverence</span>
                <span className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-gold">
                  Technology
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-7 lg:flex">
              {['Home', 'Services', 'FAQ', 'Blog', 'Careers'].map((item) =>
                item === 'Blog' || item === 'Careers' || item === 'Services' ? (
                  <Link
                    key={item}
                    href={item === 'Services' ? '/services' : `/${item.toLowerCase()}`}
                    className={navLinkClass}
                  >
                    {item}
                  </Link>
                ) : (
                  <button
                    key={item}
                    onClick={() => navigateToSection(item.toLowerCase())}
                    className={navLinkClass}
                  >
                    {item}
                  </button>
                )
              )}
              <button onClick={() => navigateToSection('projects')} className={navLinkClass}>
                Portfolio
              </button>

              <AccountMenu />

              <Button size="sm" onClick={() => navigateToSection('contact')}>
                Get Started
              </Button>
            </div>

            <div className="flex items-center gap-1.5 lg:hidden">
              <AccountMenu />
              <button
                onClick={() => setIsMenuOpen(true)}
                className="rounded-md p-2 text-ink"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </nav>
        </Container>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-ink-deep/40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed top-0 right-0 z-[110] flex h-full w-[85%] max-w-sm flex-col overflow-y-auto border-l border-rule bg-paper"
            >
              <div className="flex items-center justify-between border-b border-rule px-6 py-5">
                <span className="font-serif text-xl text-ink-deep">Reverence</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-ink"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-1 px-6 py-8">
                <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
                  Menu
                </p>
                {['Home', 'Services', 'FAQ', 'Blog', 'Careers'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'Blog' || item === 'Careers') {
                        window.location.href = `/${item.toLowerCase()}`;
                      } else if (item === 'Services') {
                        window.location.href = '/services';
                      } else {
                        navigateToSection(item.toLowerCase());
                      }
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between border-b border-rule py-3.5 text-left font-serif text-lg text-ink-deep"
                  >
                    {item}
                    <ChevronRight size={16} className="text-gold" />
                  </button>
                ))}
                <button
                  onClick={() => {
                    navigateToSection('projects');
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between border-b border-rule py-3.5 text-left font-serif text-lg text-ink-deep"
                >
                  Portfolio
                  <ChevronRight size={16} className="text-gold" />
                </button>
              </div>

              <div className="mt-auto space-y-4 border-t border-rule bg-paper-2 px-6 py-8">
                <a href="tel:+256783676313" className="flex items-center gap-3 text-sm text-ink">
                  <Phone size={16} className="text-gold" /> +256 783 676 313
                </a>
                <a href="mailto:reverencetech1@gmail.com" className="flex items-center gap-3 text-sm text-ink">
                  <Mail size={16} className="text-gold" /> reverencetech1@gmail.com
                </a>
                <div className="flex items-center gap-3 text-sm text-ink">
                  <MapPin size={16} className="text-gold" /> Kampala, Uganda
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.location.href = '/dashboard/projects/new';
                  }}
                  className={`${buttonClassName('primary', 'md', 'w-full mt-2')}`}
                >
                  Start a Project
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
