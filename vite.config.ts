import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import { serwist } from '@serwist/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tanstackStart(),
    serwist({
      swSrc: 'src/sw.ts',
      swDest: 'sw.js',
      globDirectory: 'dist',
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      injectionPoint: 'self.__SW_MANIFEST'
    })
  ],
})
