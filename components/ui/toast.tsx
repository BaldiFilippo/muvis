"use client"
// Toast semplice: mostra una notifica in basso a destra per qualche secondo
import { createContext, useContext, useState, useCallback } from "react"

type Toast = {
  id: number
  messaggio: string
  tipo: "successo" | "errore"
}

type ToastContextType = {
  mostraToast: (messaggio: string, tipo?: "successo" | "errore") => void
}

const ToastContext = createContext<ToastContextType>({ mostraToast: () => {} })

// Hook per usare il toast da qualsiasi componente
export function useToast() {
  return useContext(ToastContext)
}

// Provider che avvolge l'app e gestisce la lista di toast
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const mostraToast = useCallback((messaggio: string, tipo: "successo" | "errore" = "successo") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, messaggio, tipo }])
    // Rimuove il toast dopo 3 secondi
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ mostraToast }}>
      {children}
      {/* Contenitore dei toast, fisso in basso a destra */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
              toast.tipo === "successo"
                ? "bg-green-800 text-green-100 border border-green-600"
                : "bg-red-900 text-red-100 border border-red-700"
            }`}
          >
            {toast.messaggio}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
