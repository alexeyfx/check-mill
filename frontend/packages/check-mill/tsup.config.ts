import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/styles.css"],
  outDir: "dist",
  format: ["esm", "cjs"],
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
  minify: true,
  shims: false,
  bundle: true,
  target: "es2020",
  external: [],
});
