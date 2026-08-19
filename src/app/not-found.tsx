import Link from 'next/link';
import { buttonClassName } from '../components/ui/buttonStyles';
import Card from '../components/ui/Card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <Card className="w-full max-w-md p-10 text-center">
        <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">404</p>
        <h1 className="font-serif text-3xl text-ink-deep">Page not found</h1>
        <p className="mt-3 mb-8 text-muted">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/" className={buttonClassName('primary')}>
            Go home
          </Link>
          <Link href="/careers" className={buttonClassName('secondary')}>
            Careers
          </Link>
        </div>
      </Card>
    </div>
  );
}
