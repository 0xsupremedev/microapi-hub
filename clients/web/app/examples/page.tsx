'use client';

import { useState } from 'react';
import { CopyButton } from '../../components/ui/CopyButton';

const examples = [
  {
    title: 'TypeScript Client',
    language: 'typescript',
    code: `import fetch from 'node-fetch';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import crypto from 'crypto';

async function makePaidRequest(resourceUrl: string, walletPublicKey: PublicKey) {
  // Step 1: Request payment requirements
  const response = await fetch(resourceUrl);
  if (response.status !== 402) {
    throw new Error('Expected 402 Payment Required');
  }
  
  const { accepts } = await response.json();
  const requirements = accepts[0];
  
  // Step 2: Create payment authorization
  const nowSec = Math.floor(Date.now() / 1000);
  const nonce = \`0x\${crypto.randomBytes(32).toString('hex')}\`;
  
  const paymentPayload = {
    x402Version: 1,
    scheme: requirements.scheme,
    network: requirements.network,
    payload: {
      signature: 'demo-signature',
      authorization: {
        from: walletPublicKey.toBase58(),
        to: requirements.payTo,
        value: requirements.maxAmountRequired,
        validAfter: String(nowSec - 5),
        validBefore: String(nowSec + requirements.maxTimeoutSeconds),
        nonce
      }
    }
  };
  
  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
  
  // Step 3: Make paid request
  const paidResponse = await fetch(resourceUrl, {
    headers: { 'X-PAYMENT': paymentHeader }
  });
  
  return paidResponse.json();
}`,
  },
  {
    title: 'Python Client',
    language: 'python',
    code: `import requests
import json
import base64
import secrets
from solana.publickey import PublicKey

def make_paid_request(resource_url: str, wallet_public_key: PublicKey):
    # Step 1: Request payment requirements
    response = requests.get(resource_url)
    if response.status_code != 402:
        raise Exception('Expected 402 Payment Required')
    
    data = response.json()
    requirements = data['accepts'][0]
    
    # Step 2: Create payment authorization
    now_sec = int(time.time())
    nonce = f"0x{secrets.token_hex(32)}"
    
    payment_payload = {
        'x402Version': 1,
        'scheme': requirements['scheme'],
        'network': requirements['network'],
        'payload': {
            'signature': 'demo-signature',
            'authorization': {
                'from': str(wallet_public_key),
                'to': requirements['payTo'],
                'value': requirements['maxAmountRequired'],
                'validAfter': str(now_sec - 5),
                'validBefore': str(now_sec + requirements['maxTimeoutSeconds']),
                'nonce': nonce
            }
        }
    }
    
    payment_header = base64.b64encode(
        json.dumps(payment_payload).encode()
    ).decode()
    
    # Step 3: Make paid request
    paid_response = requests.get(
        resource_url,
        headers={'X-PAYMENT': payment_header}
    )
    
    return paid_response.json()`,
  },
  {
    title: 'Go Client',
    language: 'go',
    code: `package main

import (
    "bytes"
    "encoding/base64"
    "encoding/json"
    "net/http"
    "crypto/rand"
    "fmt"
)

func makePaidRequest(resourceURL string, walletPublicKey string) (map[string]interface{}, error) {
    // Step 1: Request payment requirements
    resp, err := http.Get(resourceURL)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 402 {
        return nil, fmt.Errorf("expected 402 Payment Required")
    }
    
    var data map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&data)
    
    accepts := data["accepts"].([]interface{})
    requirements := accepts[0].(map[string]interface{})
    
    // Step 2: Create payment authorization
    nonceBytes := make([]byte, 32)
    rand.Read(nonceBytes)
    nonce := fmt.Sprintf("0x%x", nonceBytes)
    
    paymentPayload := map[string]interface{}{
        "x402Version": 1,
        "scheme": requirements["scheme"],
        "network": requirements["network"],
        "payload": map[string]interface{}{
            "signature": "demo-signature",
            "authorization": map[string]interface{}{
                "from": walletPublicKey,
                "to": requirements["payTo"],
                "value": requirements["maxAmountRequired"],
                "validAfter": fmt.Sprintf("%d", time.Now().Unix()-5),
                "validBefore": fmt.Sprintf("%d", time.Now().Unix()+300),
                "nonce": nonce,
            },
        },
    }
    
    payloadBytes, _ := json.Marshal(paymentPayload)
    paymentHeader := base64.StdEncoding.EncodeToString(payloadBytes)
    
    // Step 3: Make paid request
    req, _ := http.NewRequest("GET", resourceURL, nil)
    req.Header.Set("X-PAYMENT", paymentHeader)
    
    client := &http.Client{}
    paidResp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer paidResp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(paidResp.Body).Decode(&result)
    return result, nil
}`,
  },
];

export default function Examples() {
  const [selectedExample, setSelectedExample] = useState(0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Usage Examples</h1>
        <p className="text-neutral-400">
          Learn how to integrate x402 payments into your applications with these code examples.
        </p>
      </div>

      {/* Example Tabs */}
      <div className="bg-slate-900 rounded-xl p-6 border border-brand/20">
        <div className="flex gap-2 mb-4">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setSelectedExample(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedExample === index
                  ? 'bg-brand text-white'
                  : 'bg-slate-800 text-neutral-300 hover:bg-slate-700'
              }`}
            >
              {example.title}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute top-2 right-2">
            <CopyButton text={examples[selectedExample].code} />
          </div>
          <pre className="bg-black rounded-lg p-4 overflow-x-auto text-sm">
            <code className="text-neutral-300">{examples[selectedExample].code}</code>
          </pre>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-slate-900 rounded-xl p-6 border border-brand/20">
        <h2 className="text-xl font-semibold mb-4">Integration Steps</h2>
        <ol className="space-y-3 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-brand font-bold">1.</span>
            <div>
              <strong>Request Payment Requirements:</strong> Make a request to your protected endpoint. You'll receive a 402 response with payment requirements.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-brand font-bold">2.</span>
            <div>
              <strong>Create Payment Authorization:</strong> Generate a payment payload with your wallet address, nonce, and time window.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-brand font-bold">3.</span>
            <div>
              <strong>Sign and Send:</strong> Include the payment header in your request. The provider will verify and settle the payment.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-brand font-bold">4.</span>
            <div>
              <strong>Access Resource:</strong> Once payment is verified, you'll receive the resource with an X-PAYMENT-RESPONSE header containing the transaction hash.
            </div>
          </li>
        </ol>
      </div>

      {/* Additional Resources */}
      <div className="bg-slate-900 rounded-xl p-6 border border-brand/20">
        <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
        <ul className="space-y-2 text-neutral-300">
          <li>
            <a href="https://github.com/coinbase/x402" className="text-brand hover:underline" target="_blank" rel="noopener noreferrer">
              x402 Protocol Specification →
            </a>
          </li>
          <li>
            <a href="/api" className="text-brand hover:underline">
              API Documentation →
            </a>
          </li>
          <li>
            <a href="/faq" className="text-brand hover:underline">
              Frequently Asked Questions →
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}
