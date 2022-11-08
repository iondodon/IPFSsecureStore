import { sveltekit } from '@sveltejs/kit/vite'

const config = {
  plugins: [sveltekit()],
  optimizeDeps: {
    esbuildOptions: {
      target: ['es2020']
    }
  },
  build: {
    target: 'es2020'
  },
  define: {
    global: {}
  }
}

export default config
