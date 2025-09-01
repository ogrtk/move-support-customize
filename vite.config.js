import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Viteの設定 
export default defineConfig({
  server: {
    open: 'src/index.js',
    https: {
      cert: fs.readFileSync(path.resolve(__dirname, "certificate/localhost.crt")),
      key: fs.readFileSync(path.resolve(__dirname, "certificate/localhost.key")),
    },
  },
})
