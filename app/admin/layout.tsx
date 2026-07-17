import type { Metadata } from "next";
import { isLoggedIn } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { AdminNav } from "@/components/AdminNav";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Administrace" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page also renders inside this layout, so don't redirect here —
  // each admin page calls requireAdmin() itself. Just hide the nav chrome
  // when logged out.
  if (!(await isLoggedIn())) {
    return <main>{children}</main>;
  }

  const settings = getSettings();
  return (
    <div className="admin-shell">
      <AdminNav siteName={settings.siteName} logoutAction={logout} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
