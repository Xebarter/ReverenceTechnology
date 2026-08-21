import type { Metadata } from 'next';
import ProjectDetails from '../../../../components/Projects/ProjectDetails';
import JsonLd from '../../../../components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '../../../../lib/seo';
import { fetchPublicProject } from '../../../../lib/seoQueries';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchPublicProject(id);
  if (!project) {
    return pageMetadata({
      title: 'Project',
      description: 'A Reverence Technology project.',
      path: `/projects/${id}`,
    });
  }
  const description =
    (project.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155) ||
    `${project.title} — a project by Reverence Technology.`;
  return pageMetadata({
    title: project.title,
    description,
    path: `/projects/${project.id}`,
    image: project.image_url,
  });
}

export default async function ProjectDetailsPage({ params }: Props) {
  const { id } = await params;
  const project = await fetchPublicProject(id);

  return (
    <>
      {project && (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Projects', path: '/projects' },
            { name: project.title, path: `/projects/${project.id}` },
          ])}
        />
      )}
      <ProjectDetails />
    </>
  );
}
