"use client"
// Pagina principale: cerca film tramite OMDB e permette di aggiungerli
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { searchMovies, getMovieDetails, type OmdbMovie, type OmdbMovieDetail } from "@/lib/omdb"
import Navbar from "@/components/Navbar"
import { toast } from "sonner"
import { Shuffle, Bookmark, Eye } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Termini casuali usati quando non si sta cercando nulla
const TERMINI_CASUALI = ["love", "war", "night", "city", "man", "time", "life", "dark"]

export default function SearchPage() {
  const router = useRouter()
  const supabase = createClient()

  const [query, setQuery] = useState("")
  const [films, setFilms] = useState<OmdbMovie[]>([])
  const [filmSelezionato, setFilmSelezionato] = useState<OmdbMovieDetail | null>(null)
  const [dialogAperto, setDialogAperto] = useState(false)
  const [caricamentoDettagli, setCaricamentoDettagli] = useState(false)
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState("")
  const [termineCorrente, setTermineCorrente] = useState("love")
  const [queryAttiva, setQueryAttiva] = useState("") // ultima ricerca effettuata
  const [filtroTipo, setFiltroTipo] = useState<"" | "movie" | "series">("")
  const [filtroDecennio, setFiltroDecennio] = useState<string>("")

  // Controlla se l'utente è loggato
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login")
    })
  }, [])

  // Carica film casuali all'avvio
  useEffect(() => {
    caricaFilmCasuali()
  }, [])

  // Filtra i risultati per decennio lato client
  function applicaFiltroDecennio(lista: OmdbMovie[], decennio: string): OmdbMovie[] {
    if (!decennio) return lista
    const inizio = parseInt(decennio)
    return lista.filter((f) => {
      const anno = parseInt(f.Year)
      return anno >= inizio && anno < inizio + 10
    })
  }

  // Carica film con un termine casuale e svuota la ricerca
  async function caricaFilmCasuali() {
    setQuery("")
    setQueryAttiva("")
    setCaricamento(true)
    setErrore("")
    const termineNuovo = TERMINI_CASUALI[Math.floor(Math.random() * TERMINI_CASUALI.length)]
    setTermineCorrente(termineNuovo)
    const risultati = await searchMovies(termineNuovo, filtroTipo || undefined)
    const filtrati = applicaFiltroDecennio(risultati, filtroDecennio)
    setFilms(filtrati.slice(0, 10))
    setCaricamento(false)
  }

  // Cerca film quando l'utente digita e preme Invio
  async function cercaFilm(e: React.FormEvent) {
    e.preventDefault()
    // Normalizza: rimuove spazi in eccesso e converte in minuscolo
    const queryNormalizzata = query.trim().toLowerCase()
    if (!queryNormalizzata) return
    setCaricamento(true)
    setErrore("")
    const risultati = await searchMovies(queryNormalizzata, filtroTipo || undefined)
    const filtrati = applicaFiltroDecennio(risultati, filtroDecennio)
    if (filtrati.length === 0) setErrore("Nessun film trovato")
    setFilms(filtrati.slice(0, 10))
    setQueryAttiva(queryNormalizzata)
    setCaricamento(false)
  }

  // Cambia il filtro tipo e rilancia la ricerca corrente
  async function cambiaTipo(nuovoTipo: "" | "movie" | "series") {
    setFiltroTipo(nuovoTipo)
    setCaricamento(true)
    setErrore("")
    const termine = queryAttiva || termineCorrente
    const risultati = await searchMovies(termine, nuovoTipo || undefined)
    const filtrati = applicaFiltroDecennio(risultati, filtroDecennio)
    if (filtrati.length === 0) setErrore("Nessun film trovato")
    setFilms(filtrati.slice(0, 10))
    setCaricamento(false)
  }

  // Cambia il filtro decennio e rilancia la ricerca corrente
  async function cambiaDecennio(nuovoDecennio: string) {
    setFiltroDecennio(nuovoDecennio)
    setCaricamento(true)
    setErrore("")
    const termine = queryAttiva || termineCorrente
    const risultati = await searchMovies(termine, filtroTipo || undefined)
    const filtrati = applicaFiltroDecennio(risultati, nuovoDecennio)
    if (filtrati.length === 0) setErrore("Nessun film trovato")
    setFilms(filtrati.slice(0, 10))
    setCaricamento(false)
  }

  // Apre il dialog e carica i dettagli completi del film
  async function apriDialog(film: OmdbMovie) {
    setDialogAperto(true)
    setFilmSelezionato(null)
    setCaricamentoDettagli(true)
    const dettagli = await getMovieDetails(film.imdbID)
    setFilmSelezionato(dettagli)
    setCaricamentoDettagli(false)
  }

  // Aggiunge il film al database con lo status scelto
  async function aggiungiFilm(status: "watchlist" | "watched") {
    if (!filmSelezionato) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from("user_movies").insert({
      user_id: session.user.id,
      imdb_id: filmSelezionato.imdbID,
      title: filmSelezionato.Title,
      poster: filmSelezionato.Poster,
      status,
    })

    if (error) {
      console.error(error)
      toast.error("Errore durante il salvataggio")
    } else {
      setDialogAperto(false)
      toast.success(
        status === "watchlist"
          ? `"${filmSelezionato.Title}" aggiunto alla Watchlist`
          : `"${filmSelezionato.Title}" segnato come Visto`
      )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Cerca</h1>
        {/* Barra di ricerca */}
        <form onSubmit={cercaFilm} className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca un film..."
            className="flex-1 px-4 py-2 bg-input border border-border rounded text-foreground"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            Cerca
          </button>
          {/* Pulsante random — sempre visibile */}
          <button
            type="button"
            onClick={() => caricaFilmCasuali()}
            title="Film casuali"
            className="px-3 py-2 bg-secondary border border-border rounded hover:opacity-90"
          >
            <Shuffle size={18} />
          </button>
        </form>

        {/* Chip filtri — due righe: tipo e decennio */}
        <div className="flex flex-col gap-2 mb-6">
          {/* Riga tipo */}
          <div className="flex flex-wrap gap-2">
            {(["", "movie", "series"] as const).map((tipo) => {
              const label = tipo === "" ? "Tutti" : tipo === "movie" ? "Film" : "Serie TV"
              const attivo = filtroTipo === tipo
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => cambiaTipo(tipo)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors whitespace-nowrap ${
                    attivo
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {/* Riga decennio */}
          <div className="flex flex-wrap gap-2">
            {[["", "Qualsiasi anno"], ["2020", "2020s"], ["2010", "2010s"], ["2000", "2000s"], ["1990", "anni '90"], ["1980", "anni '80"]].map(([valore, label]) => {
              const attivo = filtroDecennio === valore
              return (
                <button
                  key={valore}
                  type="button"
                  onClick={() => cambiaDecennio(valore)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors whitespace-nowrap ${
                    attivo
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Messaggio di errore */}
        {errore && <p className="text-red-400 mb-4">{errore}</p>}
        {caricamento && <p className="text-muted-foreground mb-4">Caricamento...</p>}

        {/* Titolo sezione */}
        {!caricamento && (
          <p className="text-muted-foreground mb-4 text-sm">
            {queryAttiva
              ? <>Risultati per: <span className="text-foreground font-medium">{queryAttiva}</span></>
              : <>Film casuali — termine: <span className="text-foreground">{termineCorrente}</span></>
            }
          </p>
        )}

        {/* Griglia dei film */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {films.map((film, index) => (
            <div
              key={film.imdbID}
              onClick={() => apriDialog(film)}
              className="cursor-pointer group"
            >
              <div className="aspect-[2/3] relative bg-muted rounded overflow-hidden mb-2">
                {film.Poster && film.Poster !== "N/A" ? (
                  <Image
                    src={film.Poster}
                    alt={film.Title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    priority={index < 2}
                    className="object-cover group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                    Nessuna immagine
                  </div>
                )}
              </div>
              <p className="text-sm font-medium truncate">{film.Title}</p>
              <p className="text-xs text-muted-foreground">{film.Year}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog con i dettagli del film */}
      <Dialog open={dialogAperto} onOpenChange={setDialogAperto}>
        <DialogContent className="max-w-lg">
          {caricamentoDettagli && (
            <p className="text-muted-foreground text-sm py-8 text-center">Caricamento...</p>
          )}

          {filmSelezionato && (
            <>
              <div className="flex gap-4">
                {/* Locandina */}
                {filmSelezionato.Poster && filmSelezionato.Poster !== "N/A" && (
                  <div className="w-24 flex-shrink-0 relative">
                    <Image
                      src={filmSelezionato.Poster}
                      alt={filmSelezionato.Title}
                      width={96}
                      height={144}
                      className="rounded object-contain w-full h-auto"
                    />
                  </div>
                )}

                {/* Titolo + dettagli */}
                <div className="flex flex-col gap-1.5 text-sm min-w-0">
                  <h2 className="text-lg font-bold leading-tight mb-1">{filmSelezionato.Title}</h2>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {filmSelezionato.Year !== "N/A" && (
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{filmSelezionato.Year}</span>
                    )}
                    {filmSelezionato.Runtime !== "N/A" && (
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{filmSelezionato.Runtime}</span>
                    )}
                    {filmSelezionato.Rated !== "N/A" && (
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{filmSelezionato.Rated}</span>
                    )}
                    {filmSelezionato.imdbRating !== "N/A" && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">⭐ {filmSelezionato.imdbRating}</span>
                    )}
                  </div>

                  {filmSelezionato.Genre !== "N/A" && (
                    <p className="text-muted-foreground text-xs">{filmSelezionato.Genre}</p>
                  )}
                  {filmSelezionato.Director !== "N/A" && (
                    <p className="text-xs"><span className="text-muted-foreground">Regia: </span>{filmSelezionato.Director}</p>
                  )}
                  {filmSelezionato.Actors !== "N/A" && (
                    <p className="text-xs"><span className="text-muted-foreground">Cast: </span>{filmSelezionato.Actors}</p>
                  )}
                  {filmSelezionato.Plot !== "N/A" && (
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{filmSelezionato.Plot}</p>
                  )}
                </div>
              </div>

              {/* Pulsanti azione */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => aggiungiFilm("watchlist")}
                  className="flex-1 py-2 bg-secondary border border-border rounded hover:opacity-90 text-sm flex items-center justify-center gap-2"
                >
                  <Bookmark size={14} /> Watchlist
                </button>
                <button
                  onClick={() => aggiungiFilm("watched")}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm flex items-center justify-center gap-2"
                >
                  <Eye size={14} /> Visto
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
