import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function GET() {
  const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_DISCOVERY_URL?.replace('/.well-known/x402','/api/data') || 'http://localhost:8080/api/data';
  try {
    const first = await fetch(providerUrl, { cache: 'no-store' });
    if (first.status !== 402) {
      const data = await first.json().catch(() => null);
      return NextResponse.json({ ok: true, stage: 'no_payment_required', data });
    }
    const pr = await first.json();
    const req = pr?.accepts?.[0];
    if (!req) return NextResponse.json({ ok: false, error: 'no_requirements' }, { status: 500 });
    const nowSec = Math.floor(Date.now() / 1000);
    const payer = process.env.PAYER_PUBKEY || 'PAYER111111111111111111111111111111111111111';
    // Exponential backoff retry for transient 429/402 rate_limited errors.
    // IMPORTANT: regenerate nonce per attempt to avoid facilitator nonce_replay on verify.
    const maxAttempts = 4;
    let lastRes: Response | null = null;
    let lastResText: string | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const attemptNowSec = Math.floor(Date.now() / 1000);
      // Generate cryptographically secure nonce per attempt to avoid replay attacks
      const nonceBytes = crypto.randomBytes(32);
      const nonce = `0x${nonceBytes.toString('hex')}`;
      const paymentHeaderObj = {
        x402Version: 1,
        scheme: 'exact',
        network: req.network,
        payload: {
          signature: 'demo-signature',
          authorization: {
            from: payer,
            to: req.payTo,
            value: req.maxAmountRequired,
            validAfter: String(attemptNowSec - 5),
            validBefore: String(attemptNowSec + 300),
            nonce
          }
        }
      };
      const xPayment = Buffer.from(JSON.stringify(paymentHeaderObj)).toString('base64');
      const res = await fetch(providerUrl, { headers: { 'x-payment': xPayment } });
      lastRes = res;
      // Use clone() so we don't consume the original body during inspection
      const txt = await res.clone().text().catch(() => '');
      lastResText = txt;
      if (res.ok) break;
      const isRateLimited = res.status === 429 || (res.status === 402 && txt.includes('rate_limited'));
      if (!isRateLimited) break;
      const delayMs = 150 * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    // If we didn't read text during the loop (shouldn't happen), read once now
    const bodyText = lastResText ?? (await (lastRes as Response).text());
    const xResp = (lastRes as Response).headers.get('x-payment-response');
    const settlement = xResp ? JSON.parse(Buffer.from(xResp, 'base64').toString('utf8')) : null;
    return NextResponse.json({ ok: (lastRes as Response).ok, status: (lastRes as Response).status, settlement, body: bodyText }, { status: (lastRes as Response).status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}


