"use client"
// Pagina Watchlist: mostra i film da vedere
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { getMovieDetails, type OmdbMovieDetail } from "@/lib/omdb"
import Navbar from "@/components/Navbar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"

// Tipo che rappresenta un record nel database
type FilmSalvato = {
  id: string
  imdb_id: string
  title: string
  poster: string
  status: string
}

export default function WatchlistPage() {
  const router = useRouter()
  const supabase = createClient()

  const [films, setFilms] = useState<FilmSalvato[]>([])
  const [caricamento, setCaricamento] = useState(true)
  const { mostraToast } = useToast()
  const [filmSelezionato, setFilmSelezionato] = useState<FilmSalvato | null>(null)
  const [dettagli, setDettagli] = useState<OmdbMovieDetail | null>(null)
  const [caricamentoDettagli, setCaricamentoDettagli] = useState(false)
  const [dialogAperto, setDialogAperto] = useState(false)

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

  // Legge i film con status 'watchlist' dal database
  async function caricaFilm(userId: string) {
    const { data, error } = await supabase
      .from("user_movies")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "watchlist")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setFilms(data || [])
    }
    setCaricamento(false)
  }

  // Apre il dialog e carica i dettagli dal film cliccato
  async function apriDettagli(film: FilmSalvato) {
    setFilmSelezionato(film)
    setDettagli(null)
    setDialogAperto(true)
    setCaricamentoDettagli(true)
    const risultato = await getMovieDetails(film.imdb_id)
    setDettagli(risultato)
    setCaricamentoDettagli(false)
  }

  // Sposta il film da watchlist a watched
  async function segnaVisto(id: string) {
    const { error } = await supabase.from("user_movies").update({ status: "watched" }).eq("id", id)
    if (error) {
      console.error(error)
      mostraToast("Errore durante l'aggiornamento", "errore")
    } else {
      setFilms(films.filter((f) => f.id !== id))
      setDialogAperto(false)
      mostraToast("Film segnato come visto!")
    }
  }

  // Rimuove un film dalla watchlist e chiude il dialog
  async function rimuoviFilm(id: string) {
    const { error } = await supabase.from("user_movies").delete().eq("id", id)
    if (error) {
      console.error(error)
      alert("Errore durante la rimozione")
    } else {
      setFilms(films.filter((f) => f.id !== id))
      setDialogAperto(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Watchlist</h1>

        {caricamento && <p className="text-muted-foreground">Caricamento...</p>}

        {!caricamento && films.length === 0 && (
          <p className="text-muted-foreground">Nessun film nella watchlist.</p>
        )}

        {/* Griglia dei film in watchlist */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {films.map((film) => (
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
                    className="object-cover group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                    Nessuna immagine
                  </div>
                )}
              </div>
              <p className="text-sm font-medium truncate">{film.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog con dettagli film */}
      <Dialog open={dialogAperto} onOpenChange={setDialogAperto}>
        <DialogContent className="max-w-lg">
          {caricamentoDettagli && (
            <p className="text-muted-foreground text-sm py-8 text-center">Caricamento...</p>
          )}

          {dettagli && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{dettagli.Title}</DialogTitle>
              </DialogHeader>

              <div className="flex gap-5 pt-2">
                {dettagli.Poster && dettagli.Poster !== "N/A" && (
                  <div className="w-28 h-40 relative rounded overflow-hidden flex-shrink-0">
                    <Image src={dettagli.Poster} alt={dettagli.Title} fill className="object-cover" />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-sm min-w-0">
                  <div className="flex flex-wrap gap-2 mb-1">
                    {dettagli.Year !== "N/A" && (
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{dettagli.Year}</span>
                    )}
                    {dettagli.Runtime !== "N/A" && (
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{dettagli.Runtime}</span>
                    )}
                    {dettagli.imdbRating !== "N/A" && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">⭐ {dettagli.imdbRating}</span>
                    )}
                  </div>
                  {dettagli.Genre !== "N/A" && (
                    <p className="text-muted-foreground text-xs">{dettagli.Genre}</p>
                  )}
                  {dettagli.Director !== "N/A" && (
                    <p className="text-xs"><span className="text-muted-foreground">Regia: </span>{dettagli.Director}</p>
                  )}
                  {dettagli.Actors !== "N/A" && (
                    <p className="text-xs"><span className="text-muted-foreground">Cast: </span>{dettagli.Actors}</p>
                  )}
                  {dettagli.Plot !== "N/A" && (
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{dettagli.Plot}</p>
                  )}
                </div>
              </div>

              {/* Pulsanti azione */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => filmSelezionato && segnaVisto(filmSelezionato.id)}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm"
                >
                  ✓ Segna come Visto
                </button>
                <button
                  onClick={() => filmSelezionato && rimuoviFilm(filmSelezionato.id)}
                  className="px-4 py-2 border border-red-800 text-red-400 hover:bg-red-950 rounded text-sm transition-colors"
                >
                  Rimuovi
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
