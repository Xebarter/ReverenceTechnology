'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Smartphone, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button, Container } from './ui';

interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  mobile_image_url: string | null;
  link: string | null;
  technologies: string[];
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(3);

      if (error) throw error;
      setProjects(data || []);
    } catch (_error) {
      console.error('Error fetching projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <section className="bg-paper py-24">
        <Container>
          <div className="mb-16 space-y-3 text-center">
            <div className="mx-auto h-8 w-48 animate-pulse bg-paper-2" />
            <div className="mx-auto h-4 w-80 animate-pulse bg-paper-2" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[320px] animate-pulse border border-rule bg-surface" />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="projects" className="bg-paper py-24 md:py-32">
      <style>{`
        .project-card-description p { color: #5E6D7A; font-size: 0.875rem; line-height: 1.6; margin: 0 0 0.5rem 0; }
        .project-card-description strong { font-weight: 600; color: #0E2436; }
      `}</style>
      <Container>
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
            Recent results
          </p>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-ink-deep md:text-5xl">
            Shipped. Live. In use.
          </h2>
          <p className="mt-5 text-lg text-muted">
            Three recent builds. Open one if you want to see how we work before you buy.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="border border-dashed border-rule py-16 text-center">
            <Search className="mx-auto mb-4 h-10 w-10 text-rule" />
            <h3 className="font-serif text-xl text-ink-deep">Portfolio under maintenance</h3>
            <p className="mt-2 text-muted">We are currently updating our latest success stories.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="group flex cursor-pointer flex-col"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex h-48 overflow-hidden border border-rule bg-paper-2">
                    <div className="relative flex w-2/3 items-center justify-center border-r border-rule bg-surface p-3">
                      {project.image_url ? (
                        <img
                          src={project.image_url}
                          alt="Desktop"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Monitor className="h-6 w-6 text-rule" />
                      )}
                    </div>
                    <div className="relative flex w-1/3 items-center justify-center p-3">
                      {project.mobile_image_url ? (
                        <img
                          src={project.mobile_image_url}
                          alt="Mobile"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Smartphone className="h-5 w-5 text-rule" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col border border-t-0 border-rule bg-surface p-5">
                    <h3 className="mb-2 font-serif text-xl text-ink-deep group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
                      {project.title}
                    </h3>
                    <div
                      className="project-card-description mb-4 line-clamp-2 flex-1 text-sm text-muted"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 2).map((tech, index) => (
                        <span
                          key={index}
                          className="border border-rule px-2 py-0.5 text-[0.625rem] uppercase tracking-wider text-muted"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 2 && (
                        <span className="border border-rule px-2 py-0.5 text-[0.625rem] text-gold">
                          +{project.technologies.length - 2}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                      See how we built this <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button onClick={() => router.push('/projects')}>
                View All Projects <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        <div className="mt-20 border border-rule bg-ink-deep px-8 py-12 text-center text-paper">
          <h3 className="font-serif text-2xl md:text-3xl">Need one of these for your business?</h3>
          <p className="mt-2 mb-8 text-paper/70">Pick a package. We send a total and a start date.</p>
          <Button
            variant="secondary"
            className="border-paper/30 text-paper hover:bg-paper hover:text-ink-deep"
            onClick={() => {
              const el = document.getElementById('services');
              el ? el.scrollIntoView({ behavior: 'smooth' }) : (window.location.hash = 'services');
            }}
          >
            Start a project
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default Projects;
