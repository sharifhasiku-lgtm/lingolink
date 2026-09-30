import type { ResourceCollectorDependencies, ResourceMetric, ResourceProvenance } from './types.js';
export declare function createSystemResourceCollector(dependencies: ResourceCollectorDependencies): {
    getCapabilities: () => {
        cpu: {
            status: "supported";
            value: {
                name: {
                    status: "supported";
                    value: string;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                vendor: {
                    status: "supported";
                    value: string;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                architecture: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                physicalCores: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                logicalCores: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                performanceCores: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                efficiencyCores: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                frequencyHz: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                cacheLineBytes: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
            };
            provenance: {
                source: string;
                scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
            };
        } | {
            status: "unavailable";
            reason?: string | undefined;
        } | {
            status: "unverified";
            reason?: string | undefined;
        } | {
            status: "failed";
            reason?: string | undefined;
        };
        memory: {
            totalBytes: {
                status: "supported";
                value: number;
                provenance: {
                    source: string;
                    scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                };
            } | {
                status: "unavailable";
                reason?: string | undefined;
            } | {
                status: "unverified";
                reason?: string | undefined;
            } | {
                status: "failed";
                reason?: string | undefined;
            };
        };
        gpus: {
            status: "supported";
            value: {
                id: string;
                name: {
                    status: "supported";
                    value: string;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                vendor: {
                    status: "supported";
                    value: string;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                type: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                driverName: {
                    status: "supported";
                    value: string;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                driverVersion: {
                    status: "supported";
                    value: string;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                drivers: {
                    vulkan: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    opencl: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    opengl: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    webgpu: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    metal: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    direct3d11: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    direct3d12: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    cuda: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    levelZero: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                    rocm: {
                        status: "supported";
                        value: boolean;
                        provenance: {
                            source: string;
                            scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                        };
                    } | {
                        status: "unavailable";
                        reason?: string | undefined;
                    } | {
                        status: "unverified";
                        reason?: string | undefined;
                    } | {
                        status: "failed";
                        reason?: string | undefined;
                    };
                };
                unifiedMemory: {
                    status: "supported";
                    value: boolean;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                memoryTotalBytes: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
            }[];
            provenance: {
                source: string;
                scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
            };
        } | {
            status: "unavailable";
            reason?: string | undefined;
        } | {
            status: "unverified";
            reason?: string | undefined;
        } | {
            status: "failed";
            reason?: string | undefined;
        };
    };
    sample: () => {
        sampledAt: number;
        cpu: ResourceMetric<number>;
        memory: {
            processUsedBytes: ResourceMetric<number>;
            processAvailableBytes: ResourceMetric<number>;
            usedBytes: ResourceMetric<number>;
            totalBytes: ResourceMetric<number>;
        };
        gpus: {
            status: "unavailable" | "unverified" | "failed";
            reason?: string;
        } | {
            status: "supported";
            value: {
                id: string;
                compute: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                encode: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                decode: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                memoryUsedBytes: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                memoryTotalBytes: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                powerWatts: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
                temperatureCelsius: {
                    status: "supported";
                    value: number;
                    provenance: {
                        source: string;
                        scope?: "device" | "system" | "process" | "budget" | "shared-system" | undefined;
                    };
                } | {
                    status: "unavailable";
                    reason?: string | undefined;
                } | {
                    status: "unverified";
                    reason?: string | undefined;
                } | {
                    status: "failed";
                    reason?: string | undefined;
                };
            }[];
            provenance: ResourceProvenance;
        };
    };
    destroy: () => void;
};
