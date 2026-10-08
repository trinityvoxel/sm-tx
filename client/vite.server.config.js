import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  ssr: { target: "webworker", noExternal: true },
  build: {
    ssr: "../server/entry-server.jsx",
    outDir: "../.server",
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "entry-server.js" } },
  },
});
