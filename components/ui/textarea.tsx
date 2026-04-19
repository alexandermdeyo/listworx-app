import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border !border-zinc-300 !bg-white px-3 py-2 text-sm !text-black ring-offset-background placeholder:!text-zinc-500 focus-visible:!bg-white focus-visible:!text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C65A1E] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:!border-zinc-300 disabled:!bg-zinc-100 disabled:!text-zinc-700 disabled:opacity-100',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
