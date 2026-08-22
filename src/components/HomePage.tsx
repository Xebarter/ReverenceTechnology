'use client';

import { useState } from 'react';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Testimonials from './Testimonials';
import SubmitTestimonial from './SubmitTestimonial';
import Contact from './Contact';
import FAQ from './FAQ';
import Projects from './Projects';

export default function HomePage() {
  const [isTestimonialFormOpen, setIsTestimonialFormOpen] = useState(false);

  return (
    <>
      <Hero />
      <Projects />
      <Services />
      <About />
      <Testimonials onShowTestimonialForm={() => setIsTestimonialFormOpen(true)} />
      <SubmitTestimonial isOpen={isTestimonialFormOpen} onClose={() => setIsTestimonialFormOpen(false)} />
      <FAQ />
      <Contact />
    </>
  );
}
