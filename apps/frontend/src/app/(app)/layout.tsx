import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { Chatbot } from '@/components/chatbot'


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />

          <main className="flex-1 p-4 md:p-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {/* ✅ Chatbot global (aparece em todas as páginas logadas) */}
      <Chatbot />
    </div>
  )
}
