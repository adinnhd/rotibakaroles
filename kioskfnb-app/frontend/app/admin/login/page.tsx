"use client"

import type { FormEvent } from "react"
import { useCallback, useEffect, useState } from "react"
import { LockKeyhole, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, getCurrentAdmin, loginAdmin } from "@/lib/admin-api"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const redirectIfAuthenticated = useCallback(async () => {
    try {
      const response = await getCurrentAdmin()

      if (response.data.user.role === "admin") {
        router.replace("/admin")
      }
    } catch (caughtError) {
      if (!(caughtError instanceof ApiError && caughtError.status === 401)) {
        setError(caughtError instanceof Error ? caughtError.message : "Gagal memeriksa sesi")
      }
    }
  }, [router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void redirectIfAuthenticated()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [redirectIfAuthenticated])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      await loginAdmin(email, password)
      router.replace("/admin")
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal login")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10 text-zinc-950">
      <section className="w-full max-w-sm rounded-md border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-zinc-900 text-white">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Admin Olivia</h1>
            <p className="text-sm text-zinc-500">Masuk untuk mengelola menu</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            <LogIn />
            {isSubmitting ? "Masuk..." : "Login"}
          </Button>
        </form>
      </section>
    </main>
  )
}
