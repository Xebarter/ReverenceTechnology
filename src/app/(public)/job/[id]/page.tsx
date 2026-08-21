import type { Metadata } from 'next';
import JobDetails from '../../../../components/JobDetails';
import JsonLd from '../../../../components/JsonLd';
import { breadcrumbJsonLd, jobJsonLd, pageMetadata } from '../../../../lib/seo';
import { fetchPublishedJob } from '../../../../lib/seoQueries';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchPublishedJob(id);
  if (!job) {
    return pageMetadata({
      title: 'Role',
      description: 'A career opening at Reverence Technology.',
      path: `/job/${id}`,
    });
  }
  const description =
    (job.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155) ||
    `Join Reverence Technology as a ${job.title}.`;
  return pageMetadata({
    title: job.title,
    description,
    path: `/job/${job.id}`,
  });
}

export default async function JobDetailsPage({ params }: Props) {
  const { id } = await params;
  const job = await fetchPublishedJob(id);

  return (
    <>
      {job && (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Careers', path: '/careers' },
              { name: job.title, path: `/job/${job.id}` },
            ]),
            jobJsonLd({
              title: job.title,
              description: job.description || job.title,
              path: `/job/${job.id}`,
              location: job.location,
              employmentType: job.employment_type,
              datePosted: job.created_at,
            }),
          ]}
        />
      )}
      <JobDetails />
    </>
  );
}
