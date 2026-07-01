"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

export function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      setError("That password didn't work. Try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
          <Lock className="h-5 w-5 text-primary-foreground" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold">RoofPitch admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the admin password to review contractor applications.
        </p>
        <label htmlFor="password" className="mt-6 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="mt-5 h-11 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
        >
          {loading ? "Checking…" : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
