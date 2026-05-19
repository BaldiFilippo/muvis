/** @type {import('next').NextConfig} */
// Configurazione Next.js — permette le immagini dal dominio OMDB
const nextConfig = {
  images: {
    domains: ["m.media-amazon.com"],
  },
}

module.exports = nextConfig
