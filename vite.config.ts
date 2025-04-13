import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    define: {
      'import.meta.env.VITE_NEO4J_URI': JSON.stringify(env.VITE_NEO4J_URI),
      'import.meta.env.VITE_NEO4J_USER': JSON.stringify(env.VITE_NEO4J_USER),
      'import.meta.env.VITE_NEO4J_PASSWORD': JSON.stringify(env.VITE_NEO4J_PASSWORD),
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY),
    }
  };
});
