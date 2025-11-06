'use client';

import { useState } from 'react';
import { PaymentModal } from './PaymentModal';
import type { PaymentRequirements } from '../../../shared/types/x402';

interface PaymentButtonProps {
  resourceUrl: string;
  requirements: PaymentRequirements;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({ resourceUrl, requirements, className, children }: PaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className || 'px-4 py-2 rounded-lg bg-brand hover:bg-brand/90 text-white font-medium transition-colors'}
      >
        {children || 'Pay & Access'}
      </button>
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resourceUrl={resourceUrl}
        requirements={requirements}
      />
    </>
  );
}
