import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["spikes/**", "docs/**", "dist/**", ".superpowers/**", ".claude/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/engine/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["react", "react-dom", "zustand", "**/game/**", "**/sandbox/**"] },
      ],
    },
  },
);
