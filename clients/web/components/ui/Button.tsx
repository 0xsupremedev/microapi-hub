import { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  variant?: 'solid' | 'outline';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, variant = 'solid', className = '', ...props }: ButtonProps) {
  const base = variant === 'solid' ? 'btn' : 'btn-outline';
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}


