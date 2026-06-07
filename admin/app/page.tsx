"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, []);

  return null;
}
