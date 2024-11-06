import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
    // build: {
    //   lib: {
    //     entry: resolve(__dirname, 'src/main/index.ts')
    //   },
    //   rollupOptions: {
    //     input: resolve(__dirname, 'src/main/index.ts')
    //   }
    // }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
    // build: {
    //   lib: {
    //     entry: resolve(__dirname, 'src/preload/index.ts')
    //   }
    // }
  },
  renderer: {
    // build: {
    //   outDir: 'dist/renderer'
    // },
    // resolve: {
    //   alias: {
    //     '@renderer': resolve(__dirname, 'src/renderer/src')
    //   }
    // },
    plugins: [react()]
  }
})
