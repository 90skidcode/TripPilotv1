"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "./layout-admin";

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
