import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border !border-zinc-300 !bg-white px-3 py-2 text-sm !text-black ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-black placeholder:!text-zinc-500 focus-visible:!bg-white focus-visible:!text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C65A1E] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:!border-zinc-300 disabled:!bg-zinc-100 disabled:!text-zinc-700 disabled:opacity-100',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
