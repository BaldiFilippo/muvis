"use client"
// Pagina di login e registrazione con Supabase Auth
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errore, setErrore] = useState("")
  const [messaggio, setMessaggio] = useState("")

  // Funzione per accedere
  async function accedi() {
    setErrore("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrore("Credenziali non valide")
      console.error(error)
    } else {
      router.push("/search")
    }
  }

  // Funzione per registrarsi
  async function registrati() {
    setErrore("")
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setErrore("Errore durante la registrazione")
      console.error(error)
    } else {
      setMessaggio("Controlla la tua email per confermare la registrazione!")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 bg-card border border-border rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Muvis</h1>

        {/* Campo email */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded text-foreground"
            placeholder="tu@email.com"
          />
        </div>

        {/* Campo password */}
        <div className="mb-6">
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded text-foreground"
            placeholder="••••••••"
          />
        </div>

        {/* Messaggio di errore */}
        {errore && <p className="text-red-400 text-sm mb-4">{errore}</p>}
        {messaggio && <p className="text-green-400 text-sm mb-4">{messaggio}</p>}

        {/* Pulsanti */}
        <div className="flex gap-3">
          <button
            onClick={accedi}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            Accedi
          </button>
          <button
            onClick={registrati}
            className="flex-1 py-2 bg-secondary text-secondary-foreground border border-border rounded hover:opacity-90"
          >
            Registrati
          </button>
        </div>
      </div>
    </div>
  )
}
