"use client";

import { useMemo } from "react";

export default function ProfilePage() {
  const user = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("crms_user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  return (
    <div className="card space-y-2">
      <h2 className="text-lg font-bold">Profile</h2>
      <p><span className="font-semibold">Name:</span> {user?.name || "Administrator"}</p>
      <p><span className="font-semibold">Email:</span> {user?.email || "admin@carrental.local"}</p>
      <p><span className="font-semibold">Role:</span> {user?.role || "Admin"}</p>
    </div>
  );
}
