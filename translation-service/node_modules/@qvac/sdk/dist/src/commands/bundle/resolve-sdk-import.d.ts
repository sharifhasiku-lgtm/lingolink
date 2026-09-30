export type SdkExportEntry = string | {
    [condition: string]: SdkExportEntry;
};
export declare function selectExportTarget(entry: SdkExportEntry | undefined): string | null;
export declare function createSdkImportResolver(sdkPath: string, sdkName: string): (specifier: string) => string;
//# sourceMappingURL=resolve-sdk-import.d.ts.map