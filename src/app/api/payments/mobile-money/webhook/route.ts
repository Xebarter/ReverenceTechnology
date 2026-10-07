import { NextResponse } from 'next/server';
import { mobileMoneyWebhookResponse } from '../../../../../server/mobileMoneyHttp';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return mobileMoneyWebhookResponse(req);
}

export function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
