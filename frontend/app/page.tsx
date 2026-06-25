"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("trippilot_token");
    const target = token ? "/dashboard" : "/login";
    try {
      router.replace(target);
    } catch {
      window.location.replace(target);
    }
  }, [router]);
  return null;
}
