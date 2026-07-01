import type { Metadata } from "next"
import { isAuthenticated } from "@/lib/admin-auth"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Admin — RoofPitch",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const authed = await isAuthenticated()
  return (
    <main className="min-h-screen bg-secondary/40">
      {authed ? <AdminDashboard /> : <AdminLogin />}
    </main>
  )
}
