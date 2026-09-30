import { failedMetric, normalizeBooleanMetric, normalizeEnumMetric, normalizeNonNegativeIntegerMetric, normalizeNonNegativeMetric, normalizePositiveIntegerMetric, normalizeStringMetric, normalizeUtilizationMetric, unavailableMetric, unverifiedMetric } from './normalize.js';
const CPU_SOURCE = 'bare-cpu-info';
const GPU_SOURCE = 'bare-gpu-info';
const GPU_MEMORY_SCOPE_REASON = 'GPU memory scope is unverified';
const GPU_UNIFIED_MEMORY_REASON = 'GPU shares system memory, so its reading is not a separate device pool';
// DXGI reports CurrentUsage and Budget, which are what this process is using
// and may use — not what the device holds. An idle machine makes Budget look
// like VRAM, so no value-level check can separate them; only the platform can.
// Reported under the `budget` scope rather than discarded: what a process may
// allocate is exactly what an admission decision needs.
const gpuBudgetProvenance = {
    source: GPU_SOURCE,
    scope: 'budget'
};
// A sampled total that matches what the device declares for itself is
// describing that device's own pool. Measured: a discrete card agrees within a
// few percent (1.00 on linux, 0.96 on win32), while an Intel iGPU declares
// 128 MiB and samples 31891 MiB — half of system RAM — so nothing near this
// band can confuse the two.
const GPU_MEMORY_AGREEMENT_MIN = 0.9;
const GPU_MEMORY_AGREEMENT_MAX = 1.1;
const cpuSystemProvenance = {
    source: CPU_SOURCE,
    scope: 'system'
};
const cpuProvenance = {
    source: CPU_SOURCE
};
const gpuDeviceProvenance = {
    source: GPU_SOURCE,
    scope: 'device'
};
const gpuProvenance = {
    source: GPU_SOURCE
};
const processProvenance = {
    source: 'bare-os',
    scope: 'process'
};
function supportedMetric(value, provenance) {
    return { status: 'supported', value, provenance };
}
function isPositiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
/**
 * Whether a GPU's sampled memory describes that device's own pool rather than
 * some other quantity under the same name. A unified-memory GPU is excluded
 * outright: its allocation is system RAM, which the memory budget already
 * covers. For the rest, the sample has to agree with what the device declares.
 */
function gpuMemoryIsDeviceScoped(declared, unified, sampledTotal) {
    if (unified !== false)
        return false;
    if (!isPositiveNumber(declared) || !isPositiveNumber(sampledTotal))
        return false;
    const ratio = sampledTotal / declared;
    return ratio >= GPU_MEMORY_AGREEMENT_MIN && ratio <= GPU_MEMORY_AGREEMENT_MAX;
}
/** The device's own declared memory, trusted unless it shares system RAM. */
function normalizeDeclaredGPUMemory(value, unified) {
    if (value === undefined || value === null)
        return unavailableMetric();
    const normalized = normalizeNonNegativeMetric(value, gpuDeviceProvenance);
    if (normalized.status !== 'supported')
        return normalized;
    return unified === false ? normalized : unverifiedMetric(GPU_UNIFIED_MEMORY_REASON);
}
function normalizeSampledGPUMemory(value, scope, reason) {
    if (value === undefined || value === null)
        return unavailableMetric();
    const provenance = scope === 'budget' ? gpuBudgetProvenance : gpuDeviceProvenance;
    const normalized = normalizeNonNegativeMetric(value, provenance);
    if (normalized.status !== 'supported')
        return normalized;
    return scope ? normalized : unverifiedMetric(reason);
}
function normalizeDriverCapabilities(drivers) {
    return {
        vulkan: normalizeBooleanMetric(drivers.vulkan, gpuProvenance),
        opencl: normalizeBooleanMetric(drivers.opencl, gpuProvenance),
        opengl: normalizeBooleanMetric(drivers.opengl, gpuProvenance),
        webgpu: normalizeBooleanMetric(drivers.webgpu, gpuProvenance),
        metal: normalizeBooleanMetric(drivers.metal, gpuProvenance),
        direct3d11: normalizeBooleanMetric(drivers.direct3d11, gpuProvenance),
        direct3d12: normalizeBooleanMetric(drivers.direct3d12, gpuProvenance),
        cuda: normalizeBooleanMetric(drivers.cuda, gpuProvenance),
        levelZero: normalizeBooleanMetric(drivers.levelZero, gpuProvenance),
        rocm: normalizeBooleanMetric(drivers.rocm, gpuProvenance)
    };
}
function normalizeCPUCapabilities(cpu, architectures) {
    return {
        name: normalizeStringMetric(cpu.name, cpuProvenance),
        vendor: normalizeStringMetric(cpu.vendor, cpuProvenance),
        architecture: normalizeEnumMetric(cpu.arch, architectures, cpuProvenance),
        physicalCores: normalizePositiveIntegerMetric(cpu.physicalCores, cpuProvenance),
        logicalCores: normalizePositiveIntegerMetric(cpu.logicalCores, cpuProvenance),
        performanceCores: normalizeNonNegativeIntegerMetric(cpu.performanceCores, cpuProvenance),
        efficiencyCores: normalizeNonNegativeIntegerMetric(cpu.efficiencyCores, cpuProvenance),
        frequencyHz: normalizePositiveIntegerMetric(cpu.frequency, cpuProvenance),
        cacheLineBytes: normalizePositiveIntegerMetric(cpu.cacheLine, cpuProvenance)
    };
}
function normalizeGPUCapabilities(gpu, id, gpuTypes) {
    return {
        id,
        name: normalizeStringMetric(gpu.name, gpuDeviceProvenance),
        vendor: normalizeStringMetric(gpu.vendor, gpuDeviceProvenance),
        type: normalizeEnumMetric(gpu.type, gpuTypes, gpuDeviceProvenance),
        driverName: normalizeStringMetric(gpu.driverName, gpuDeviceProvenance),
        driverVersion: normalizeStringMetric(gpu.driverVersion, gpuDeviceProvenance),
        drivers: normalizeDriverCapabilities(gpu.drivers),
        unifiedMemory: normalizeBooleanMetric(gpu.unifiedMemory, gpuDeviceProvenance),
        memoryTotalBytes: normalizeDeclaredGPUMemory(gpu.memory, gpu.unifiedMemory)
    };
}
function failedCPUSample(reason) {
    const failure = failedMetric(reason);
    return {
        cpu: failure,
        memory: {
            usedBytes: failure,
            totalBytes: failure
        }
    };
}
function failedGPUSample(id, reason) {
    return {
        id,
        compute: failedMetric(reason),
        encode: failedMetric(reason),
        decode: failedMetric(reason),
        memoryUsedBytes: failedMetric(reason),
        memoryTotalBytes: failedMetric(reason),
        powerWatts: failedMetric(reason),
        temperatureCelsius: failedMetric(reason)
    };
}
function normalizeGPUSample(id, usage, device, platform) {
    // win32 values come from DXGI's per-process query, so they describe this
    // process's budget rather than the device — real, but a different quantity.
    const scope = platform === 'win32'
        ? device?.unifiedMemory === false
            ? 'budget'
            : undefined
        : gpuMemoryIsDeviceScoped(device?.declaredMemory, device?.unifiedMemory, usage.memoryTotal)
            ? 'device'
            : undefined;
    return {
        id,
        compute: normalizeUtilizationMetric(usage.compute, gpuDeviceProvenance),
        encode: normalizeUtilizationMetric(usage.encode, gpuDeviceProvenance),
        decode: normalizeUtilizationMetric(usage.decode, gpuDeviceProvenance),
        memoryUsedBytes: normalizeSampledGPUMemory(usage.memoryUsed, scope, 'GPU memory usage scope is unverified'),
        memoryTotalBytes: normalizeSampledGPUMemory(usage.memoryTotal, scope, GPU_MEMORY_SCOPE_REASON),
        powerWatts: normalizeNonNegativeMetric(usage.power, gpuDeviceProvenance),
        temperatureCelsius: normalizeNonNegativeMetric(usage.temperature, gpuDeviceProvenance)
    };
}
function destroyContext(context) {
    try {
        context?.destroy();
    }
    catch {
        // Teardown must continue so every native context gets a release attempt.
    }
}
export function createSystemResourceCollector(dependencies) {
    let cpuContext;
    let gpuContext;
    let gpuIds = [];
    let gpuMemoryFacts = [];
    let destroyed = false;
    let cpuCapabilities;
    let memoryCapabilities;
    let gpuCapabilities;
    try {
        const context = dependencies.createCPUInfo();
        if (!context) {
            cpuCapabilities = failedMetric('CPU collector module is unavailable');
            memoryCapabilities = {
                totalBytes: failedMetric('CPU collector module is unavailable')
            };
        }
        else {
            cpuContext = context;
            const cpu = context.query();
            cpuCapabilities = supportedMetric(normalizeCPUCapabilities(cpu, dependencies.cpuArchitectures), cpuProvenance);
            memoryCapabilities = {
                totalBytes: normalizePositiveIntegerMetric(cpu.memory, cpuSystemProvenance)
            };
        }
    }
    catch {
        cpuCapabilities = failedMetric('CPU collector initialization failed');
        memoryCapabilities = {
            totalBytes: failedMetric('CPU collector initialization failed')
        };
    }
    try {
        const context = dependencies.createGPUInfo();
        if (!context) {
            gpuCapabilities = failedMetric('GPU collector module is unavailable');
        }
        else {
            gpuContext = context;
            const gpus = context.gpus();
            const normalized = gpus.map((gpu) => normalizeGPUCapabilities(gpu, dependencies.createGPUId(), dependencies.gpuTypes));
            gpuIds = normalized.map((gpu) => gpu.id);
            gpuMemoryFacts = gpus.map((gpu) => ({
                declaredMemory: gpu.memory,
                unifiedMemory: gpu.unifiedMemory
            }));
            gpuCapabilities = supportedMetric(normalized, gpuProvenance);
        }
    }
    catch {
        gpuCapabilities = failedMetric('GPU collector initialization failed');
    }
    const capabilities = {
        cpu: cpuCapabilities,
        memory: memoryCapabilities,
        gpus: gpuCapabilities
    };
    function getCapabilities() {
        return capabilities;
    }
    function sampleCPU() {
        if (!cpuContext) {
            return failedCPUSample('CPU collector is unavailable');
        }
        try {
            const usage = cpuContext.sample();
            return {
                cpu: normalizeUtilizationMetric(usage.compute, cpuSystemProvenance),
                memory: {
                    usedBytes: normalizeNonNegativeIntegerMetric(usage.memoryUsed, cpuSystemProvenance),
                    totalBytes: normalizePositiveIntegerMetric(usage.memoryTotal, cpuSystemProvenance)
                }
            };
        }
        catch {
            return failedCPUSample('CPU resource sampling failed');
        }
    }
    function sampleGPUs() {
        if (!gpuContext)
            return failedMetric('GPU collector is unavailable');
        if (gpuCapabilities.status !== 'supported') {
            return failedMetric('GPU inventory is unavailable');
        }
        const context = gpuContext;
        const samples = gpuIds.map((id, index) => {
            try {
                return normalizeGPUSample(id, context.sample(index), gpuMemoryFacts[index], dependencies.platform);
            }
            catch {
                return failedGPUSample(id, 'GPU resource sampling failed');
            }
        });
        return supportedMetric(samples, gpuProvenance);
    }
    function sampleProcessMemory() {
        try {
            const view = dependencies.sampleProcessMemory();
            return {
                processUsedBytes: view.usedBytes === undefined
                    ? unavailableMetric('process memory usage is not exposed on this platform')
                    : normalizeNonNegativeIntegerMetric(view.usedBytes, processProvenance),
                processAvailableBytes: view.availableBytes === undefined
                    ? unavailableMetric('the per-process allowance is not exposed on this platform')
                    : normalizeNonNegativeIntegerMetric(view.availableBytes, processProvenance)
            };
        }
        catch {
            return {
                processUsedBytes: failedMetric('process memory sampling failed'),
                processAvailableBytes: failedMetric('process memory sampling failed')
            };
        }
    }
    function sample() {
        const cpuSample = sampleCPU();
        return {
            sampledAt: dependencies.now(),
            cpu: cpuSample.cpu,
            memory: { ...cpuSample.memory, ...sampleProcessMemory() },
            gpus: sampleGPUs()
        };
    }
    function destroy() {
        if (destroyed)
            return;
        destroyed = true;
        destroyContext(cpuContext);
        destroyContext(gpuContext);
        cpuContext = undefined;
        gpuContext = undefined;
        gpuIds = [];
        gpuMemoryFacts = [];
    }
    return {
        getCapabilities,
        sample,
        destroy
    };
}
