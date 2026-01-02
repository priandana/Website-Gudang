"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.15 });
  }, []);

  useEffect(() => {
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 250);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return null;
}
