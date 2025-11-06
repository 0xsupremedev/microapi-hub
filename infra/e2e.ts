import 'dotenv/config';
import fetch from 'node-fetch';
import crypto from 'node:crypto';

async function main() {
  const providerUrl = process.env.PROVIDER_URL ?? 'http://localhost:8080/api/data';
  const payer = process.env.PAYER_PUBKEY ?? 'PAYER111111111111111111111111111111111111111';

  const first = await fetch(providerUrl);
  if (first.status !== 402) {
    const j = await first.json().catch(() => null);
    console.log('Expected 402, got', first.status, j);
    process.exit(first.ok ? 0 : 1);
  }
  const pr = (await first.json()) as any;
  const req = pr.accepts[0];

  const nowSec = Math.floor(Date.now() / 1000);
  // Generate cryptographically secure nonce
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
        validAfter: String(nowSec - 5),
        validBefore: String(nowSec + 300),
        nonce
      }
    }
  };
  const xPayment = Buffer.from(JSON.stringify(paymentHeaderObj)).toString('base64');

  const second = await fetch(providerUrl, { headers: { 'x-payment': xPayment } });
  const xResp = second.headers.get('x-payment-response');
  if (!xResp) {
    console.error('Missing X-PAYMENT-RESPONSE');
    process.exit(1);
  }
  const settlement = JSON.parse(Buffer.from(xResp, 'base64').toString('utf8')) as any;
  if (!(settlement && typeof settlement === 'object' && 'success' in settlement)) {
    console.error('Invalid settlement shape', settlement);
    process.exit(1);
  }
  console.log('OK', { status: second.status, txHash: settlement.txHash || settlement.signature });
  if (!second.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


