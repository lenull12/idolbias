"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/verify");
        if (!res.ok) {
          router.replace("/admin/login");
        } else {
          setChecking(false);
        }
      } catch {
        router.replace("/admin/login");
      }
    })();
  }, [pathname, router]);

  if (checking && pathname !== "/admin/login") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "#0a0a0f", color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#FF1493", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
