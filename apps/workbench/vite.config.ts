import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: process.env["VITE_BASE"] ?? "/next/",
  build: {
    outDir: "../../next",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@taroke/core": resolve(__dirname, "../../packages/core/src/index.ts"),
      "@taroke/schema": resolve(__dirname, "../../packages/schema/src/index.ts"),
      "@taroke/artifact-runtime": resolve(__dirname, "../../packages/artifact-runtime/src/index.ts"),
      "@taroke/ui": resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@taroke/fixtures": resolve(__dirname, "../../packages/fixtures/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "../../packages/*/src/**/*.{test,spec}.ts"],
  },
});
