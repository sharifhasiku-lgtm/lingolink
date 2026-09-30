/**
 * Throw if no plugins are registered before an SDK call. On Pear,
 * point at the generated worker entry; otherwise raise a generic
 * registration error. `isPear` is overridable for tests.
 */
export declare function ensurePluginsRegistered(opts?: {
    isPear?: boolean;
}): Promise<void>;
//# sourceMappingURL=ensure-worker-ready.d.ts.map