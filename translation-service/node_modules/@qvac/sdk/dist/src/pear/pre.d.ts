/**
 * QVAC Pear Pre-Hook
 *
 * Invoked by Pear before `pear run` or `pear stage` to:
 * 1. Generate `qvac/worker.pear.entry.mjs` with selected plugins
 * 2. Persist `pear.stage.entrypoints` to package.json for routing
 *
 * Note: `qvac verify bundle` is not wired here yet — run it manually
 * (locally and/or in CI) before `pear stage` / `pear run`.
 *
 * @example package.json configuration
 * ```json
 * {
 *   "pear": {
 *     "pre": ["@qvac/sdk/pear-pre"]
 *   }
 * }
 * ```
 */
export {};
//# sourceMappingURL=pre.d.ts.map