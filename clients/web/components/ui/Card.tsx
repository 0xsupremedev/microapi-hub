import { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`card p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}


