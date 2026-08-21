import Careers from '../../../components/Careers';
import { pageMetadata } from '../../../lib/seo';

export const metadata = pageMetadata({
  title: 'Careers',
  description:
    'Join Reverence Technology in Kampala. Open roles for software developers and digital specialists building products for East Africa.',
  path: '/careers',
});

export default function CareersPage() {
  return <Careers />;
}
