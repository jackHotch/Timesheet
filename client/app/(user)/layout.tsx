import ProtectedLayout from "@/components/utils/protected-layout"
import AppSidebar from "@/components/layout/sidebar"

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 ml-60 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedLayout>
  )
}
