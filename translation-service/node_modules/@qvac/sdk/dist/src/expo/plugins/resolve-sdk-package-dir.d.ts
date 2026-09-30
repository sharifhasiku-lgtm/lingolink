declare const SDK_PACKAGE_NAMES: string[];
type SDKPackageInfo = {
    dir: string;
    name: string;
};
/**
 * Resolves the installed SDK package directory from node_modules.
 *
 * Walks from `projectRoot` up to the filesystem root, checking each
 * `node_modules` directory along the way. This matches Node's own module
 * resolution so packages hoisted to a monorepo root (e.g. by bun or yarn
 * workspaces) are found correctly.
 *
 * When multiple SDK installs are found across the tree, the one closest to
 * `projectRoot` wins and a warning lists the others. Only throws
 * `MultipleSDKInstallationsError` when two *different* SDK package names
 * coexist at the same nesting level (a real ambiguity in package selection).
 */
declare function resolveSDKPackageDir(projectRoot: string): SDKPackageInfo;
export { resolveSDKPackageDir, SDK_PACKAGE_NAMES };
export type { SDKPackageInfo };
//# sourceMappingURL=resolve-sdk-package-dir.d.ts.map