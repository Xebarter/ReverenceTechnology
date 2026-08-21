import HomePage from '../../components/HomePage';
import JsonLd from '../../components/JsonLd';
import { breadcrumbJsonLd } from '../../lib/seo';

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }])} />
      <HomePage />
    </>
  );
}
