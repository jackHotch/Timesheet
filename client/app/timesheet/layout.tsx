import ProtectedLayout from "@/components/protected-layout"

export default function TimesheetLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
