import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

export default function Page() {
  return (
    <div className="flex h-screen w-screen">
      <div className="h-full w-[50vw] rounded-r-4xl bg-card p-8">
        <div className="flex items-center gap-2">
          <Clock color="var(--primary)" size={24} />
          <h1 className="text-3xl font-bold text-primary">Timesheet</h1>
        </div>

        <div>
          <Button>Login</Button>
        </div>
      </div>
      <div className="h-full w-[60vw]">
        <img
          src="/login-illustration.svg"
          alt="image"
          width="100%"
          height="100vh"
        />
      </div>
    </div>
  )
}
