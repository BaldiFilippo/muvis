"use client"
// Pagina Visti: mostra i film visti con stelle e commenti
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { getMovieDetails, type OmdbMovieDetail } from "@/lib/omdb"
import Navbar from "@/components/Navbar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "sonner"

// Tipo che rappresenta un film visto nel database
type FilmVisto = {
  id: string
  imdb_id: string
  title: string
  poster: string
  rating: number | null
  comment: string | null
  watched_at: string | null
  created_at: string
}

export default function WatchedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [films, setFilms] = useState<FilmVisto[]>([])
  const [caricamento, setCaricamento] = useState(true)
  const [filmSelezionato, setFilmSelezionato] = useState<FilmVisto | null>(null)
  const [dettagli, setDettagli] = useState<OmdbMovieDetail | null>(null)
  const [caricamentoDettagli, setCaricamentoDettagli] = useState(false)
  const [dialogAperto, setDialogAperto] = useState(false)
  const [stelleSelezionate, setStelle] = useState(0)
  const [commento, setCommento] = useState("")
  const [dataVisto, setDataVisto] = useState("")

  // Controlla autenticazione e carica i film
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login")
      } else {
        caricaFilm(session.user.id)
      }
    })
  }, [])

  // Legge i film con status 'watched' dal database
  async function caricaFilm(userId: string) {
    const { data, error } = await supabase
      .from("user_movies")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "watched")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
    } else {
      const lista = data || []
      setFilms(lista)

      // Se c'è un param ?open=<id> apri subito il dialog di quel film
      const openId = searchParams.get("open")
      if (openId) {
        const film = lista.find((f) => f.id === openId)
        if (film) apriDettagli(film)
      }
    }
    setCaricamento(false)
  }

  // Apre il dialog con dettagli + recensione esistente
  async function apriDettagli(film: FilmVisto) {
    setFilmSelezionato(film)
    setStelle(film.rating || 0)
    setCommento(film.comment || "")
    // Usa watched_at se presente, altrimenti created_at come default
    const dataDefault = film.watched_at || film.created_at
    setDataVisto(dataDefault ? dataDefault.slice(0, 10) : "")
    setDettagli(null)
    setDialogAperto(true)
    setCaricamentoDettagli(true)
    const risultato = await getMovieDetails(film.imdb_id)
    setDettagli(risultato)
    setCaricamentoDettagli(false)
  }

  // Salva la recensione nel database
  async function salvaRecensione() {
    if (!filmSelezionato) return
    const { error } = await supabase
      .from("user_movies")
      .update({ rating: stelleSelezionate, comment: commento, watched_at: dataVisto || null })
      .eq("id", filmSelezionato.id)

    if (error) {
      console.error(error)
      toast.error("Errore durante il salvataggio")
    } else {
      setFilms(films.map((f) =>
        f.id === filmSelezionato.id
          ? { ...f, rating: stelleSelezionate, comment: commento, watched_at: dataVisto }
          : f
      ))
      setDialogAperto(false)
      toast.success("Recensione salvata!")
    }
  }

  // Rimuove un film dalla lista dei visti
  async function rimuoviFilm(id: string) {
    const { error } = await supabase.from("user_movies").delete().eq("id", id)
    if (error) {
      console.error(error)
      toast.error("Errore durante la rimozione")
    } else {
      setFilms(films.filter((f) => f.id !== id))
      setDialogAperto(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Film Visti</h1>

        {caricamento && <p className="text-muted-foreground">Caricamento...</p>}

        {!caricamento && films.length === 0 && (
          <p className="text-muted-foreground">Nessun film segnato come visto.</p>
        )}

        {/* Griglia dei film visti */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {films.map((film, index) => (
            <div
              key={film.id}
              onClick={() => apriDettagli(film)}
              className="cursor-pointer group flex flex-col"
            >
              <div className="aspect-[2/3] relative bg-muted rounded overflow-hidden mb-2">
                {film.poster && film.poster !== "N/A" ? (
                  <Image
                    src={film.poster}
                    alt={film.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    priority={index < 2}
                    className="object-cover group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                    Nessuna immagine
                  </div>
                )}
              </div>
              <p className="text-sm font-medium truncate mb-1">{film.title}</p>
              {/* Data visione */}
              <p className="text-xs text-muted-foreground mb-1">
                {formatData(film.watched_at || film.created_at)}
              </p>
              {/* Stelle piccole sotto la locandina */}
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-xs ${s <= (film.rating || 0) ? "text-yellow-400" : "text-muted-foreground"}`}>★</span>
                ))}
              </div>
              {/* Anteprima commento */}
              {film.comment && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">"{film.comment}"</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog con dettagli + sezione recensione */}
      <Dialog open={dialogAperto} onOpenChange={setDialogAperto}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {caricamentoDettagli && (
            <p className="text-muted-foreground text-sm py-12 text-center">Caricamento...</p>
          )}

          {dettagli && (
            <>
              {/* Sezione superiore: poster + info */}
              <div className="flex gap-4 p-6 pb-5">
                {dettagli.Poster && dettagli.Poster !== "N/A" && (
                  <div className="w-24 flex-shrink-0">
                    <Image src={dettagli.Poster} alt={dettagli.Title} width={96} height={144} className="rounded-lg object-contain w-full h-auto" />
                  </div>
                )}

                <div className="flex flex-col justify-between min-w-0 py-0.5">
                  <div>
                    <h2 className="text-xl font-bold leading-tight mb-3">{dettagli.Title}</h2>

                    {/* Badge info */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {dettagli.Year !== "N/A" && (
                        <span className="px-2 py-0.5 bg-white/10 rounded-md text-xs text-zinc-300">{dettagli.Year}</span>
                      )}
                      {dettagli.Runtime !== "N/A" && (
                        <span className="px-2 py-0.5 bg-white/10 rounded-md text-xs text-zinc-300">{dettagli.Runtime}</span>
                      )}
                      {dettagli.imdbRating !== "N/A" && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-md text-xs font-medium">★ {dettagli.imdbRating}</span>
                      )}
                    </div>

                    {dettagli.Genre !== "N/A" && (
                      <p className="text-zinc-500 text-xs mb-2">{dettagli.Genre}</p>
                    )}
                    {dettagli.Director !== "N/A" && (
                      <p className="text-xs mb-1"><span className="text-zinc-500">Regia </span><span className="text-zinc-200">{dettagli.Director}</span></p>
                    )}
                    {dettagli.Actors !== "N/A" && (
                      <p className="text-xs"><span className="text-zinc-500">Cast </span><span className="text-zinc-200">{dettagli.Actors}</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trama */}
              {dettagli.Plot !== "N/A" && (
                <div className="px-6 pb-5">
                  <p className="text-xs text-zinc-400 leading-relaxed">{dettagli.Plot}</p>
                </div>
              )}

              {/* Data visione */}
              <div className="px-6 pb-5 flex flex-wrap items-center gap-3">
                <span className="text-xs text-zinc-500 shrink-0">Visto il</span>
                <input
                  type="date"
                  value={dataVisto}
                  onChange={(e) => setDataVisto(e.target.value)}
                  className="px-3 py-1.5 bg-input border border-border rounded-lg text-foreground text-xs [color-scheme:dark]"
                />
              </div>

              {/* Sezione recensione */}
              <div className="border-t border-border bg-white/[0.02] px-6 py-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">La tua recensione</p>

                {/* Stelle */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((stella) => (
                    <button
                      key={stella}
                      onClick={() => setStelle(stella)}
                      className={`text-2xl transition-colors ${
                        stella <= stelleSelezionate ? "text-yellow-400" : "text-zinc-700 hover:text-yellow-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Campo commento */}
                <textarea
                  value={commento}
                  onChange={(e) => setCommento(e.target.value)}
                  rows={2}
                  placeholder="Cosa ne pensi?"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground resize-none text-sm placeholder:text-zinc-600"
                />

                {/* Pulsanti */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={salvaRecensione}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium transition-opacity"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => filmSelezionato && rimuoviFilm(filmSelezionato.id)}
                    className="px-4 py-2 border border-red-900 text-red-500 hover:bg-red-950/50 rounded-lg text-sm transition-colors"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Formatta una data ISO in formato italiano (es. "24 mag 2026")
function formatData(data: string | null) {
  if (!data) return ""
  const d = new Date(data)
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
}
