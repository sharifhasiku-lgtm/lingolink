import { type Pack } from 'tar-stream';
export declare const RESOURCE_COLLECTOR_PACKAGES: readonly ["bare-cpu-info", "bare-gpu-info"];
export declare const RESOURCE_COLLECTOR_SIZE_BUDGETS: {
    readonly compressedBytes: number;
    readonly uncompressedBytes: number;
};
export interface ResourceCollectorAcceptanceOptions {
    projectRoot: string;
    bundlePath: string;
    manifestPath: string;
    hosts: string[];
    budgets?: ResourceCollectorSizeBudgets;
}
export interface ResourceCollectorSizeBudgets {
    compressedBytes: number;
    uncompressedBytes: number;
}
export interface ResourceCollectorTargetMeasurement {
    host: string;
    files: Array<{
        package: string;
        relativePath: string;
        bytes: number;
    }>;
    compressedBytes: number;
    uncompressedBytes: number;
}
export interface ResourceCollectorAcceptanceReport {
    ok: boolean;
    collectors: string[];
    hosts: string[];
    budgets: ResourceCollectorSizeBudgets;
    targets: ResourceCollectorTargetMeasurement[];
    issues: ResourceCollectorAcceptanceIssue[];
}
export type ResourceCollectorAcceptanceIssue = {
    code: 'missing-collector';
    level: 'error';
    package: string;
    location: 'bundle' | 'manifest';
    message: string;
} | {
    code: 'missing-prebuild';
    level: 'error';
    package: string;
    host: string;
    message: string;
} | {
    code: 'invalid-manifest';
    level: 'error';
    message: string;
} | {
    code: 'measurement-failed';
    level: 'error';
    package: string;
    host: string;
    message: string;
} | {
    code: 'compressed-budget-exceeded' | 'uncompressed-budget-exceeded';
    level: 'error';
    host: string;
    actualBytes: number;
    budgetBytes: number;
    message: string;
};
interface MeasurementEntry {
    package: string;
    relativePath: string;
    bytes: number;
    contents: Buffer;
}
interface ResourceCollectorMeasurementDependencies {
    writeArchiveEntry: (pack: Pack, entry: MeasurementEntry) => Promise<void>;
}
export declare function acceptResourceCollectorPackaging(options: ResourceCollectorAcceptanceOptions): Promise<ResourceCollectorAcceptanceReport>;
export declare function formatResourceCollectorAcceptanceReport(report: ResourceCollectorAcceptanceReport): string;
export declare function measureTarget(host: string, entries: MeasurementEntry[], dependencies?: ResourceCollectorMeasurementDependencies): Promise<{
    host: string;
    files: {
        package: string;
        relativePath: string;
        bytes: number;
    }[];
    compressedBytes: number;
    uncompressedBytes: number;
}>;
export {};
//# sourceMappingURL=resource-collectors.d.ts.map