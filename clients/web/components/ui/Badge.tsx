import { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, className = '', ...props }: BadgeProps) {
  return (
    <span className={`badge ${className}`} {...props}>
      {children}
    </span>
  );
}


