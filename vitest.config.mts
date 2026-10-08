// Vitest config: resolve the `@/*` tsconfig path alias (src/*) so tests can
// import application modules the same way Next.js code does.

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
