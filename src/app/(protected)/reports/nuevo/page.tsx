"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy route — redirects to /reception where the full
 * order-creation wizard (with mandatory client signature) lives.
 */
export default function NuevoInformePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reception");
  }, [router]);

  return null;
}
