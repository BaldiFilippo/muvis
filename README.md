# Muvis

App per tenere traccia dei film e delle serie TV che hai visto o che vuoi vedere.

## Funzionalità

- **Cerca** — ricerca film e serie tramite l'API OMDB, con filtri per tipo (film/serie) e decennio
- **Watchlist** — salva i titoli che vuoi vedere
- **Visti** — segna i titoli come visti, aggiungi una valutazione (1-5 stelle), un commento e la data di visione
- **Statistiche** — panoramica personale con grafici su film visti, voti e attività mensile

## Stack

- [Next.js 14](https://nextjs.org/) — framework React con App Router
- [Supabase](https://supabase.com/) — autenticazione e database
- [OMDB API](https://www.omdbapi.com/) — dati su film e serie
- [Tailwind CSS](https://tailwindcss.com/) — stile
- [shadcn/ui](https://ui.shadcn.com/) — componenti UI, include [Recharts](https://recharts.org/) (grafici nella pagina statistiche) e [Sonner](https://sonner.emilkowal.ski/) (notifiche toast)
- [Lucide React](https://lucide.dev/) — icone

## OMDB API

Tutta la logica di comunicazione con OMDB è centralizzata in [`lib/omdb.ts`](lib/omdb.ts).

### Base URL

```
https://www.omdbapi.com/?apikey=<chiave>
```

### Endpoint utilizzati

#### Ricerca per titolo — `?s=`

```
GET /?apikey=...&s=batman&type=movie
```

| Parametro | Descrizione |
|---|---|
| `s` | Testo da cercare nel titolo |
| `type` | Opzionale: `movie` o `series` |

Risposta: array di risultati in `data.Search`, ognuno con `imdbID`, `Title`, `Year`, `Poster`.

#### Dettagli singolo film — `?i=`

```
GET /?apikey=...&i=tt1285016&plot=short
```

| Parametro | Descrizione |
|---|---|
| `i` | ID IMDB del film (es. `tt1285016`) |
| `plot` | `short` per la trama breve |

Risposta: oggetto completo con `Title`, `Year`, `Poster`, `Plot`, `Genre`, `Director`, `Actors`, `Runtime`, `imdbRating`, `Rated`.

### Tipi TypeScript

```ts
// Risultato di ricerca (lista)
type OmdbMovie = {
  imdbID: string
  Title: string
  Year: string
  Poster: string
}

// Dettaglio singolo film
type OmdbMovieDetail = OmdbMovie & {
  Plot: string
  Genre: string
  Director: string
  Actors: string
  Runtime: string
  imdbRating: string
  Rated: string
}
```

> **Limite:** il piano gratuito di OMDB consente 1.000 richieste al giorno.

## Setup

1. Clona il repository e installa le dipendenze:

```bash
npm install
```

2. Crea un file `.env.local` nella root con le seguenti variabili:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_OMDB_API_KEY=...
```

3. Nel progetto Supabase crea la tabella `user_movies` con le seguenti colonne:

| Colonna | Tipo | Note |
|---|---|---|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `user_id` | `uuid` | foreign key → `auth.users` |
| `imdb_id` | `text` | |
| `title` | `text` | |
| `poster` | `text` | |
| `status` | `text` | `watchlist` oppure `watched` |
| `rating` | `int2` | nullable |
| `comment` | `text` | nullable |
| `watched_at` | `timestamptz` | nullable, default `now()` |
| `created_at` | `timestamptz` | default `now()` |

4. Avvia il server di sviluppo:

```bash
npm run dev
```

L'app sarà disponibile su [http://localhost:3000](http://localhost:3000).
