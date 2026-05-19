// Layout principale dell'app — avvolge tutte le pagine
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { ToastProvider } from "@/components/ui/toast"
import "./globals.css"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Muvis",
  description: "Tieni traccia dei film che vuoi vedere",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body className={poppins.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
