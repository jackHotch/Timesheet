import ProtectedLayout from "@/components/utils/protected-layout"
import AppSidebar from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 ml-60 bg-sidebar">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedLayout>
  )
}
