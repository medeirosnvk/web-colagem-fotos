import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pacote from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Versão exibida no cabeçalho — sobe a cada feature publicada.
  define: { __VERSAO__: JSON.stringify(pacote.version) },
})
