"use client";

import { useState } from 'react';
import Hero from '../../components/Hero';
import About from '../../components/About';
import Services from '../../components/Services';
import Testimonials from '../../components/Testimonials';
import SubmitTestimonial from '../../components/SubmitTestimonial';
import Contact from '../../components/Contact';
import FAQ from '../../components/FAQ';
import Projects from '../../components/Projects';
import SEO from '../../components/SEO';

export default function HomePage() {
  const [isTestimonialFormOpen, setIsTestimonialFormOpen] = useState(false);

  return (
    <>
      <SEO />
      <Hero />
      <Projects />
      <About />
      <Services />
      <Testimonials onShowTestimonialForm={() => setIsTestimonialFormOpen(true)} />
      <SubmitTestimonial isOpen={isTestimonialFormOpen} onClose={() => setIsTestimonialFormOpen(false)} />
      <Contact />
      <FAQ />
    </>
  );
}
