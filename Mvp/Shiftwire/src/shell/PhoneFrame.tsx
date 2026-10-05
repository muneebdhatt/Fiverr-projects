import type { ReactNode } from 'react';
import clsx from 'clsx';

/** A phone-shaped container on desktop that fills the screen on a real phone. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="mx-auto w-full max-w-[390px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-[#0e1a2c] sm:bg-[#0e1a2c] sm:shadow-2xl">
      <div className={clsx('relative flex min-h-[640px] flex-col overflow-hidden bg-white sm:min-h-[760px] sm:rounded-[1.9rem]', className)}>
        <div className="hidden items-center justify-between px-6 pb-1 pt-3 text-[11px] font-semibold text-ink-700 sm:flex">
          <span>9:41</span>
          <span className="h-5 w-24 rounded-full bg-[#0e1a2c]" />
          <span>5G</span>
        </div>
        {children}
      </div>
    </div>
  );
}
