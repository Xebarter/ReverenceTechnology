import Blog from '../../../components/Blog';
import { pageMetadata } from '../../../lib/seo';

export const metadata = pageMetadata({
  title: 'Insights & News',
  description:
    'Perspectives on software, digital transformation, and building technology for businesses in Uganda and East Africa — from Reverence Technology.',
  path: '/blog',
});

export default function BlogPage() {
  return <Blog />;
}
