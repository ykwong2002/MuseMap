import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    'process.env': {
      NEO4J_URI: JSON.stringify(process.env.NEO4J_URI),
      NEO4J_USER: JSON.stringify(process.env.NEO4J_USER),
      NEO4J_PASSWORD: JSON.stringify(process.env.NEO4J_PASSWORD),
      OPENAI_API_KEY: JSON.stringify(process.env.OPENAI_API_KEY),
    },
  },
});
