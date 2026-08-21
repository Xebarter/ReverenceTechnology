import DepositTracking from '../../../components/DepositTracking';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata = noIndexMetadata('Deposits', '/deposits');

export default function DepositsPage() {
  return <DepositTracking />;
}
