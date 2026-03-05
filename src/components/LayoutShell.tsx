import type { ReactNode } from "react";

type LayoutShellProps = {
  children: ReactNode;
};

export default function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-sm text-slate-800">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
