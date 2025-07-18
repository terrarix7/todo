import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import { serwist } from '@serwist/vite'

export default defineConfig(({ mode }) => ({
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true
  },
  plugins: [
    tanstackStart(),
    mode === 'production' && serwist({
      swSrc: 'src/sw.ts',
      swDest: 'sw.js',
      globDirectory: '.tanstack/start/build/client-dist',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
      injectionPoint: 'self.__SW_MANIFEST',
      maximumFileSizeToCacheInBytes: 5000000
    })
  ].filter(Boolean),
}))
