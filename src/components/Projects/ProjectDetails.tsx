'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  ExternalLink,
  Monitor,
  Smartphone,
  Cpu,
  Calendar,
  Globe,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Badge, Card, Container, PageHeader } from '../ui';

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

const ProjectDetails: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchRelatedProjects();
    }
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProject = async (projectId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_featured', true)
        .limit(3);

      if (error) throw error;
      setRelatedProjects(data || []);
    } catch (error) {
      console.error('Error fetching related projects:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-rule border-t-ink"></div>
          <p className="font-medium italic text-muted">Loading project…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-paper px-4 py-16 text-center">
        <h2 className="mb-4 font-serif text-3xl font-medium text-ink-deep">Project Not Found</h2>
        <button onClick={() => router.back()} className="font-medium text-ink underline decoration-gold underline-offset-4">
          Return to Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="bg-paper pb-20">
      <PageHeader
        eyebrow="Case study"
        title={project.title}
        description={
          <span className="flex flex-wrap items-center gap-4">
            {project.is_featured && (
              <Badge>
                <ShieldCheck className="h-3 w-3 text-gold" /> Featured Work
              </Badge>
            )}
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </button>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-ink underline decoration-gold underline-offset-4"
              >
                Live Site <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            )}
          </span>
        }
      />

      <Container className="py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-gold" />
                  <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">Web Interface</h3>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 rounded-t-2xl border border-b-0 border-rule bg-ink-deep p-3">
                  <div className="h-3 w-3 rounded-full bg-paper/30" />
                  <div className="h-3 w-3 rounded-full bg-paper/30" />
                  <div className="h-3 w-3 rounded-full bg-paper/30" />
                  <div className="ml-4 w-full max-w-sm truncate rounded-md bg-ink px-4 py-1 font-mono text-[11px] text-paper/60">
                    {project.link || "https://case-study-preview.internal"}
                  </div>
                </div>
                <div className="overflow-hidden rounded-b-2xl border border-rule bg-surface shadow-[0_18px_40px_-32px_rgb(14_36_54/0.45)]">
                  <div className="flex min-h-[300px] max-h-[600px] w-full items-center justify-center overflow-hidden bg-paper">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt="Desktop Experience"
                        className="block h-full max-h-[600px] w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted">
                        <Monitor className="h-10 w-10 opacity-20" />
                        <span className="text-sm italic">Desktop preview unavailable</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <article className="rounded-2xl border border-rule bg-surface p-8 shadow-[0_1px_2px_rgb(14_36_54/0.04)] md:p-12">
              <h2 className="mb-8 border-b border-rule pb-4 font-serif text-2xl font-medium text-ink-deep">
                The Challenge & Solution
              </h2>
              <div
                className="prose prose-editorial"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            </article>
          </div>

          <div className="space-y-8 lg:col-span-4">
            <Card className="overflow-hidden p-6">
              <h3 className="mb-6 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
                <Smartphone className="h-4 w-4 text-gold" /> Mobile Experience
              </h3>
              <div className="relative mx-auto aspect-[9/18] w-full max-w-[260px] overflow-hidden rounded-[1.75rem] border border-rule bg-ink-deep shadow-[0_18px_40px_-28px_rgb(14_36_54/0.55)]">
                <div className="flex h-full w-full items-center justify-center">
                  {project.mobile_image_url ? (
                    <img
                      src={project.mobile_image_url}
                      alt="Mobile UI"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="p-8 text-center text-xs italic text-paper/50">
                      Mobile responsive design <br /> screenshot coming soon
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-medium text-ink-deep">
                <Cpu className="h-5 w-5 text-gold" /> Core Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-rule bg-paper px-3 py-1.5 text-xs font-medium text-ink"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>

            <div className="panel-dark p-6 text-paper">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-paper/60"><Calendar className="h-4 w-4" /> Launched</span>
                  <span className="font-medium">
                    {new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="h-px w-full bg-paper/15" />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-paper/60"><Globe className="h-4 w-4" /> Type</span>
                  <span className="font-medium">Full-Stack Solution</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProjects.length > 0 && (
          <div className="mt-20 border-t border-rule pt-16">
            <h2 className="mb-10 font-serif text-2xl font-medium text-ink-deep">More Projects</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {relatedProjects
                .filter(p => p.id !== project.id)
                .slice(0, 2)
                .filter((rp) => Boolean(rp?.id))
                .map((rp) => (
                  <Link
                    href={`/projects/${rp.id}`}
                    key={rp.id}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover-lift group flex flex-col overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_1px_2px_rgb(14_36_54/0.04)]"
                  >
                    <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-rule bg-paper">
                      <img
                        src={rp.image_url || ''}
                        className="h-full w-full object-contain"
                        alt={rp.title}
                      />
                    </div>
                    <div className="p-6">
                      <h4 className="flex items-center justify-between font-serif text-lg font-medium text-ink-deep group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
                        {rp.title}
                        <ChevronRight className="h-4 w-4 text-gold" />
                      </h4>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ProjectDetails;
