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
- [Recharts](https://recharts.org/) — grafici nella pagina statistiche
- [Sonner](https://sonner.emilkowal.ski/) — notifiche toast
- [Lucide React](https://lucide.dev/) — icone

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
