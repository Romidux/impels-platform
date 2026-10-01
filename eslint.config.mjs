import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Worktrees que Claude Code crea por sesión: son copias completas del
    // proyecto, así que sin esto el lint reporta cada archivo varias veces.
    ".claude/**",
    // Con comodín: el patrón relativo solo tapaba el .next de la raíz, no los
    // de las copias.
    "**/.next/**",
    // Default ignores of eslint-config-next:
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
