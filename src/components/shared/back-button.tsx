"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Destination to use when there is no previous page in history (e.g. direct link / new tab). */
  fallback: string;
  label?: string;
  className?: string;
}

/**
 * A back button that calls `router.back()` when the user arrived from within the
 * app, and navigates to `fallback` when no browser history is available.
 */
export function BackButton({ fallback, label = "Volver", className }: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background",
        "px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
