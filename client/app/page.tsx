"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLogin } from "@/hooks/use-login"

export default function Page() {
  const router = useRouter()
  const { mutate: login, isPending, error } = useLogin()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login(
      { email, password },
      {
        onSuccess: (data) => {
          localStorage.setItem("access_token", data.access_token)
          router.push("/timesheet")
        },
      }
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel — login form */}
      <div className="relative z-10 flex h-full w-1/2 flex-col justify-between rounded-r-4xl bg-card p-10 shadow-2xl">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Clock color="var(--primary)" size={22} />
          <span className="font-heading text-xl font-bold text-primary">Timesheet</span>
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h2 className="font-heading text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">
                Invalid email or password. Please try again.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Timesheet. All rights reserved.
        </p>
      </div>

      {/* Right panel — illustration */}
      <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-primary/10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 60% 50%, oklch(0.827 0.119 306.383 / 0.35) 0%, oklch(0.496 0.265 301.924 / 0.18) 50%, transparent 100%)",
          }}
        />
        {/* Decorative circles */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 left-16 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/20 shadow-xl ring-1 ring-primary/30 backdrop-blur-sm">
            <Clock size={48} color="var(--primary)" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-2xl font-bold text-foreground">Track your time</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Log hours, manage projects, and review your productivity — all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
