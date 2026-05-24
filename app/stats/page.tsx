"use client"
// Pagina Statistiche: mostra dati personali sui film dell'utente
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { Eye, Bookmark, Star, MessageSquare } from "lucide-react"

// Tipo che rappresenta un film nel database
type FilmDB = {
  id: string
  title: string
  status: string
  rating: number | null
  comment: string | null
  poster: string
  created_at: string
  watched_at: string | null
}

export default function StatsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [films, setFilms] = useState<FilmDB[]>([])
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login")
      } else {
        caricaFilm(session.user.id)
      }
    })
  }, [])

  async function caricaFilm(userId: string) {
    const { data, error } = await supabase
      .from("user_movies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (!error) setFilms(data || [])
    setCaricamento(false)
  }

  // --- Calcoli statistiche ---
  const visti = films.filter((f) => f.status === "watched")
  const watchlist = films.filter((f) => f.status === "watchlist")
  const recensiti = visti.filter((f) => f.rating !== null)

  const votoMedio =
    recensiti.length > 0
      ? (recensiti.reduce((acc, f) => acc + (f.rating || 0), 0) / recensiti.length).toFixed(1)
      : null

  // Top 3 film per voto
  const top3 = [...recensiti]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3)

  const distribuzione = [1, 2, 3, 4, 5].map((stelle) => ({
    name: `${stelle}★`,
    voti: recensiti.filter((f) => f.rating === stelle).length,
  }))

  const attivitaMensile = ultimi6Mesi().map(({ label, anno, mese }) => ({
    name: label,
    film: visti.filter((f) => {
      const d = new Date(f.watched_at || f.created_at)
      return d.getFullYear() === anno && d.getMonth() === mese
    }).length,
  }))

  if (caricamento) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <p className="text-center text-zinc-400 mt-20">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold mb-6">Statistiche</h1>

        {films.length === 0 ? (
          <div className="text-center mt-32">
            <p className="text-zinc-500">Aggiungi qualche film per vedere le statistiche.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Riquadri numerici */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/watched">
                <Numero label="Film visti" valore={visti.length} icon={<Eye size={16} />} accent="blue" />
              </Link>
              <Link href="/watchlist">
                <Numero label="Watchlist" valore={watchlist.length} icon={<Bookmark size={16} />} accent="violet" />
              </Link>
              <Link href="/watched">
                <Numero label="Voto medio" valore={votoMedio ?? "—"} icon={<Star size={16} />} accent="yellow" />
              </Link>
              <Link href="/watched">
                <Numero label="Recensiti" valore={recensiti.length} icon={<MessageSquare size={16} />} accent="green" />
              </Link>
            </div>

            {/* Grafici */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Attività per mese */}
              {visti.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Attività</p>
                  <h2 className="text-sm font-semibold text-zinc-200 mb-4">Film visti negli ultimi 6 mesi</h2>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={attivitaMensile} barSize={20} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [v, "film"]}
                      />
                      <Bar dataKey="film" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Distribuzione voti */}
              {recensiti.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Voti</p>
                  <h2 className="text-sm font-semibold text-zinc-200 mb-4">Distribuzione voti</h2>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={distribuzione} barSize={20} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#facc15" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [v, "film"]}
                      />
                      <Bar dataKey="voti" radius={[4, 4, 0, 0]} fill="#facc15" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top 3 film */}
            {top3.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">I tuoi film preferiti</p>
                <div className="flex flex-col gap-3">
                  {top3.map((film, index) => (
                    <Link key={film.id} href={`/watched?open=${film.id}`} className="block">
                      <div className="flex items-center gap-4 hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors">
                        {/* Posizione */}
                        <span className="text-2xl font-bold text-zinc-700 w-6 shrink-0 text-center">
                          {index + 1}
                        </span>
                        {/* Poster */}
                        {film.poster && film.poster !== "N/A" && (
                          <img
                            src={film.poster}
                            alt={film.title}
                            className="w-10 h-14 object-cover rounded shrink-0"
                          />
                        )}
                        {/* Info */}
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <p className="font-medium truncate">{film.title}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={`text-sm ${s <= (film.rating || 0) ? "text-yellow-400" : "text-zinc-700"}`}>★</span>
                            ))}
                          </div>
                          {film.comment && (
                            <p className="text-xs text-zinc-500 italic truncate">"{film.comment}"</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// Accenti colore per ogni card
const accentMap: Record<string, string> = {
  blue:   "text-blue-400",
  violet: "text-violet-400",
  yellow: "text-yellow-400",
  green:  "text-emerald-400",
}

// Card numerica
function Numero({ label, valore, icon, accent }: {
  label: string
  valore: number | string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-zinc-500 transition-colors cursor-pointer h-full">
      <div className={`mb-3 ${accentMap[accent]}`}>{icon}</div>
      <div className="text-3xl font-bold tracking-tight">{valore}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  )
}

// Ultimi 6 mesi
function ultimi6Mesi() {
  const mesi = []
  const nomi = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
  const ora = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ora.getFullYear(), ora.getMonth() - i, 1)
    mesi.push({ label: nomi[d.getMonth()], anno: d.getFullYear(), mese: d.getMonth() })
  }
  return mesi
}
