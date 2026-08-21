import ProjectsList from '../../../components/Projects/ProjectsList';
import { pageMetadata } from '../../../lib/seo';

export const metadata = pageMetadata({
  title: 'Projects',
  description:
    'Selected software, web, and mobile work by Reverence Technology — products and systems delivered for organisations in Uganda and East Africa.',
  path: '/projects',
});

export default function ProjectsPage() {
  return <ProjectsList />;
}
