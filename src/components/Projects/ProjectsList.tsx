'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  Smartphone,
  ArrowRight,
  Search,
  Layout
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button, Container, PageHeader } from '../ui';

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

const ProjectsList: React.FC = () => {
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
        .order('display_order', { ascending: true });

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
      <div className="min-h-screen bg-paper">
        <PageHeader
          eyebrow="Our Portfolio"
          title="Digital solutions & innovation"
          description="Explore our complete portfolio of projects where technical excellence meets business transformation."
        />
        <Container className="py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[350px] animate-pulse border border-rule bg-surface" />
            ))}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <style>{`
        .project-card-description p {
          color: #5E6D7A;
          font-size: 0.875rem;
          line-height: 1.6;
          margin: 0 0 0.5rem 0;
        }
        .project-card-description strong { font-weight: 600; color: #0E2436; }
        .project-card-description:last-child { margin-bottom: 0; }
      `}</style>

      <PageHeader
        eyebrow="Our Portfolio"
        title="Digital solutions & innovation"
        description="Explore our complete portfolio of projects where technical excellence meets business transformation."
      />

      <Container className="py-16">
        {projects.length === 0 ? (
          <div className="border border-dashed border-rule py-16 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-rule" />
            <h3 className="font-serif text-xl font-medium text-ink-deep">Portfolio under maintenance</h3>
            <p className="mt-2 text-muted">We are currently updating our latest success stories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="group flex h-full cursor-pointer flex-col overflow-hidden border border-rule bg-surface"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="relative flex h-36 overflow-hidden border-b border-rule bg-paper-2">
                  <div className="relative flex w-2/3 items-center justify-center border-r border-rule bg-surface p-2">
                    <div className="absolute left-2 top-2 z-10 flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-rule" />
                      <div className="h-1.5 w-1.5 rounded-full bg-rule" />
                    </div>
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt="Desktop"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Monitor className="h-6 w-6 text-rule" />
                    )}
                    <span className="absolute bottom-1 right-2 text-[8px] font-semibold uppercase tracking-tighter text-muted">Desktop</span>
                  </div>

                  <div className="relative flex w-1/3 items-center justify-center p-2">
                    {project.mobile_image_url ? (
                      <img
                        src={project.mobile_image_url}
                        alt="Mobile"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Smartphone className="h-5 w-5 text-rule" />
                    )}
                    <span className="absolute bottom-1 right-2 text-[8px] font-semibold uppercase tracking-tighter text-muted">Mobile</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-serif text-lg font-medium text-ink-deep group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
                      {project.title}
                    </h3>
                  </div>

                  <div className="min-h-0 flex-1">
                    <div
                      className="project-card-description mb-4 line-clamp-2 text-sm text-muted"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  </div>

                  <div className="pt-2">
                    <div className="mb-4 flex min-h-[28px] flex-wrap gap-1">
                      {project.technologies.slice(0, 2).map((tech, index) => (
                        <span
                          key={index}
                          className="rounded-md border border-rule px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 2 && (
                        <span className="rounded-md border border-rule px-2 py-1 text-[10px] font-semibold text-gold">
                          +{project.technologies.length - 2}
                        </span>
                      )}
                    </div>

                    <span className="flex w-full items-center justify-center gap-2 rounded-md bg-ink py-2.5 text-sm font-medium text-paper">
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="relative mt-16 overflow-hidden border border-rule bg-ink-deep p-8 text-center text-paper">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
            <Layout size={200} />
          </div>
          <div className="relative z-10">
            <h3 className="mb-1 font-serif text-xl font-medium">Have a project in mind?</h3>
            <p className="mb-4 text-sm text-paper/70">Let&apos;s build something exceptional together.</p>
            <Button
              variant="secondary"
              className="border-paper/30 text-paper hover:bg-paper hover:text-ink-deep"
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.hash = 'contact';
                }
              }}
            >
              Start a Conversation
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProjectsList;
