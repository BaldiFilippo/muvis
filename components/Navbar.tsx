"use client"
// Barra di navigazione presente in tutte le pagine autenticate
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, Bookmark, Eye, BarChart2, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  function linkClass(href: string) {
    const attivo = pathname === href || pathname.startsWith(href)
    return `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      attivo
        ? "text-white bg-white/10"
        : "text-zinc-400 hover:text-white hover:bg-white/5"
    }`
  }

  return (
    <nav className="w-full bg-background border-b border-border px-3 sm:px-6 py-2 flex items-center justify-between">
      {/* Link di navigazione */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-center">
        <Link href="/search" className={linkClass("/search")}>
          <Search size={16} />
          <span className="hidden sm:inline">Cerca</span>
        </Link>
        <Link href="/watchlist" className={linkClass("/watchlist")}>
          <Bookmark size={16} />
          <span className="hidden sm:inline">Watchlist</span>
        </Link>
        <Link href="/watched" className={linkClass("/watched")}>
          <Eye size={16} />
          <span className="hidden sm:inline">Visti</span>
        </Link>
        <Link href="/stats" className={linkClass("/stats")}>
          <BarChart2 size={16} />
          <span className="hidden sm:inline">Stats</span>
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors shrink-0"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Esci</span>
      </button>
    </nav>
  )
}
