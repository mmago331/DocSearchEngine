// frontend/src/d/primitives.ts
// small design primitives used by AppShell and layout

// handy tailwind class combiner
export function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

// Page container constraints
export const pageContainer = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

// Left sidebar width
export const sidebarWidth = "w-56";

// Top bar height
export const headerHeight = "h-14";

// Common surface styling for cards/sections
export const surface = "rounded-2xl border border-gray-200 bg-white shadow-sm";

// Section title
export const sectionTitle = "text-lg font-medium tracking-tight text-gray-900";

// Muted helper text
export const muted = "text-sm text-gray-500";
