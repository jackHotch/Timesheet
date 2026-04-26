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
    <div className="relative h-screen w-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at 90% 10%, oklch(0.75 0.17 315 / 0.5) 0%, transparent 50%)",
            "radial-gradient(ellipse at 60% 90%, oklch(0.35 0.28 292 / 0.65) 0%, transparent 45%)",
            "linear-gradient(148deg, oklch(0.17 0.06 288) 0%, oklch(0.36 0.22 299) 45%, oklch(0.55 0.27 305) 75%, oklch(0.62 0.2 310) 100%)",
          ].join(", "),
        }}
      />

      <div className="absolute right-0 top-0 flex h-full w-[55%] flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 shadow-xl ring-1 ring-white/20 backdrop-blur-sm">
          <Clock size={48} color="white" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-bold text-white">Track your time</h3>
          <p className="max-w-xs text-sm text-white/60">
            Log hours, manage projects, and review your productivity — all in one place.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex h-full w-1/2 flex-col justify-between rounded-r-4xl bg-background p-10 shadow-2xl">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Clock color="var(--primary)" size={22} />
          <span className="font-heading text-xl font-bold text-primary">Timesheet</span>
        </div>

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

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Timesheet. All rights reserved.
        </p>
      </div>
    </div>
  )
}
