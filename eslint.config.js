// Flat ESLint config for ESLint v9+
// Use FlatCompat to load Next.js's legacy config under flat system
const { FlatCompat } = require("@eslint/eslintrc")
const compat = new FlatCompat({ baseDirectory: __dirname })

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "build/**",
      "**/*.d.ts",
      "**/generated/**",
      "**/*.min.*",
    ],
  },
  // Bring in Next's recommended rules via legacy adapter
  ...compat.extends("next/core-web-vitals"),
]
