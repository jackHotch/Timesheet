import ProtectedLayout from "@/components/utils/protected-layout"

export default function TimesheetLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
