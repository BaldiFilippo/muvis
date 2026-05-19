"use client"
// Barra di navigazione presente in tutte le pagine autenticate
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, Bookmark, Eye, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Disconnette l'utente e torna al login
  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Stile del link attivo vs inattivo
  function linkClass(href: string) {
    const attivo = pathname === href || pathname.startsWith(href)
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      attivo
        ? "text-white bg-white/10"
        : "text-zinc-400 hover:text-white hover:bg-white/5"
    }`
  }

  return (
    <nav className="w-full bg-background border-b border-border px-6 py-3 flex items-center">
      {/* Link di navigazione — centrati */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        <Link href="/search" className={linkClass("/search")}>
          <Search size={15} />
          Cerca
        </Link>
        <Link href="/watchlist" className={linkClass("/watchlist")}>
          <Bookmark size={15} />
          Watchlist
        </Link>
        <Link href="/watched" className={linkClass("/watched")}>
          <Eye size={15} />
          Visti
        </Link>
      </div>

      {/* Pulsante logout a destra */}
      <button
        onClick={logout}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <LogOut size={15} />
        Esci
      </button>
    </nav>
  )
}
