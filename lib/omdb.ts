// Funzioni per chiamare l'API OMDB
const API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY
const BASE_URL = "https://www.omdbapi.com"

// Tipo base per i risultati della ricerca
export type OmdbMovie = {
  imdbID: string
  Title: string
  Year: string
  Poster: string
}

// Tipo completo con i dettagli del singolo film
export type OmdbMovieDetail = OmdbMovie & {
  Plot: string
  Genre: string
  Director: string
  Actors: string
  Runtime: string
  imdbRating: string
  Rated: string
}

// Cerca film per titolo, con filtro opzionale per tipo
// query è il titolo del film da cercare
export async function searchMovies(query: string, type?: "movie" | "series"): Promise<OmdbMovie[]> {
  const typeParam = type ? `&type=${type}` : ""
  const res = await fetch(`${BASE_URL}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}${typeParam}`)
  const data = await res.json()
  if (data.Response === "False") return []
  return data.Search || []
}

// Recupera i dettagli completi di un film tramite il suo ID IMDB
export async function getMovieDetails(imdbID: string): Promise<OmdbMovieDetail | null> {
  const res = await fetch(`${BASE_URL}/?apikey=${API_KEY}&i=${imdbID}&plot=short`)
  const data = await res.json()
  if (data.Response === "False") return null
  return data
}
