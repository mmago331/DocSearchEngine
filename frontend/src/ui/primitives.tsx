import React from "react";
import clsx from "clsx";

export function Button(
  { variant = "primary", className, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"ghost"|"outline"|"danger" }
){
  const base = "inline-flex items-center justify-center rounded-lg px-4 h-9 text-sm font-medium transition";
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50",
    ghost: "text-indigo-700 hover:bg-indigo-50",
    outline: "border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-500"
  }[variant];
  return <button className={clsx(base, styles, className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
        "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
  )
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
        "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
  )
);

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-xl border border-gray-200 bg-white shadow-sm", className)} {...props} />;
}
export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("p-6", className)} {...props} />;
}

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={clsx("min-w-full text-sm", className)} {...props} />;
}
export const Th = (p: React.ThHTMLAttributes<HTMLTableCellElement>) =>
  <th {...p} className={clsx("px-3 py-2 text-left font-semibold text-gray-700", p.className)} />;
export const Td = (p: React.TdHTMLAttributes<HTMLTableCellElement>) =>
  <td {...p} className={clsx("px-3 py-2 align-top text-gray-800", p.className)} />;

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700", className)}>{children}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx("h-5 w-5 animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}

/** NOTE: When you drop in the Catalyst kit, you can re-export their components here
 *  (e.g., export { Button } from "@/catalyst/button";) so all app code stays the same.
 */
