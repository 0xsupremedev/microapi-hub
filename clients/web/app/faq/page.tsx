'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What is x402?',
    answer: 'x402 is an open payment standard that enables clients to pay for external resources (APIs, content, data) using blockchain payments. It follows HTTP status code 402 (Payment Required) semantics and provides a standardized way to implement pay-per-use APIs with on-chain settlement and verifiable receipts.',
  },
  {
    question: 'Which blockchains are supported?',
    answer: 'Currently, MicroAPI Hub supports Solana (devnet and mainnet). The x402 protocol itself supports multiple blockchains including EVM chains (Ethereum, Base, etc.). Support for additional chains can be added by implementing the appropriate payment scheme.',
  },
  {
    question: 'How fast is payment settlement?',
    answer: 'On Solana, payment settlement typically confirms in 1-2 seconds. The entire payment flow (request → payment → verification → settlement → resource access) usually completes in under 5 seconds.',
  },
  {
    question: 'What tokens can I use for payments?',
    answer: 'MicroAPI Hub supports both native SOL and SPL tokens (like USDC). The provider can specify which asset they accept in their payment requirements. The facilitator handles both native and SPL token transfers.',
  },
  {
    question: 'How do I become a provider?',
    answer: 'To become a provider, you can register your API endpoint using our registry contract. You\'ll need to specify your endpoint URL, pricing, accepted tokens, and other metadata. Once registered, clients can discover and pay for your API.',
  },
  {
    question: 'Is there a minimum payment amount?',
    answer: 'There\'s no hard minimum, but very small payments may not be economical due to transaction fees. For Solana, we recommend minimum payments of at least 0.001 SOL or equivalent in tokens to cover fees.',
  },
  {
    question: 'How do I verify a payment receipt?',
    answer: 'All payments return an X-PAYMENT-RESPONSE header containing the transaction hash. You can verify payments by checking the transaction on Solscan or using Solana RPC to query the transaction status.',
  },
  {
    question: 'What happens if a payment fails?',
    answer: 'If payment verification fails, you\'ll receive a 402 response with details about the failure. If settlement fails, the facilitator will return an error with the reason. Common issues include insufficient funds, expired nonces, or invalid signatures.',
  },
  {
    question: 'Can I use this with AI agents?',
    answer: 'Yes! x402 is designed to be agent-friendly. The protocol uses standard HTTP headers and JSON payloads, making it easy for AI agents to automatically handle payments when accessing paid APIs. The nonce-based replay protection ensures secure automated payments.',
  },
  {
    question: 'How do I get started as a developer?',
    answer: 'Check out our Examples page for code samples in TypeScript, Python, and Go. You can also explore the API documentation to understand the protocol details. For integration help, see our Developer Guide.',
  },
  {
    question: 'Is this open source?',
    answer: 'Yes! MicroAPI Hub is built for the Solana X402 Hackathon and all code is open source. The x402 protocol specification is also open and maintained by Coinbase.',
  },
  {
    question: 'What are the fees?',
    answer: 'Providers pay standard Solana transaction fees (typically ~0.000005 SOL) for settlement. The facilitator may charge additional fees, but the demo facilitator is free. The actual payment amount goes to the provider.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-neutral-400">
          Common questions about x402, MicroAPI Hub, and how to use blockchain payments for APIs.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800 transition-colors"
            >
              <span className="font-semibold text-white">{faq.question}</span>
              <span className="text-brand text-xl">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-neutral-300">
                <p className="leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-xl p-6 border border-brand/20 mt-8">
        <h2 className="text-xl font-semibold mb-3">Still have questions?</h2>
        <p className="text-neutral-300 mb-4">
          Check out our documentation or explore the code examples to learn more.
        </p>
        <div className="flex gap-3">
          <a
            href="/examples"
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand/90 text-white font-medium transition-colors"
          >
            View Examples
          </a>
          <a
            href="/api"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            API Docs
          </a>
        </div>
      </div>
    </main>
  );
}
