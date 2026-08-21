import TermsAndConditions from '../../../components/TermsAndConditions';
import { pageMetadata } from '../../../lib/seo';

export const metadata = pageMetadata({
  title: 'Terms & Conditions',
  description: 'Terms of use, privacy, and commercial conditions for Reverence Technology services and this website.',
  path: '/terms',
});

export default function TermsPage() {
  return <TermsAndConditions />;
}
