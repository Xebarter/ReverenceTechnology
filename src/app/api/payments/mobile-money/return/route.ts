import { mobileMoneyReturnResponse } from '../../../../../server/mobileMoneyHttp';

export const runtime = 'nodejs';

export function GET(req: Request) {
  return mobileMoneyReturnResponse(req);
}
