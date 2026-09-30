const UNAVAILABLE_REASON = 'Metric is unavailable';
const UNVERIFIED_REASON = 'Metric value could not be verified';
export function unavailableMetric(reason = UNAVAILABLE_REASON) {
    return { status: 'unavailable', reason };
}
export function unverifiedMetric(reason = UNVERIFIED_REASON) {
    return { status: 'unverified', reason };
}
export function failedMetric(reason) {
    return { status: 'failed', reason };
}
export function normalizeNonNegativeMetric(value, provenance) {
    if (value === undefined || value === null)
        return unavailableMetric();
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return unverifiedMetric();
    }
    return { status: 'supported', value, provenance };
}
export function normalizePositiveMetric(value, provenance) {
    const metric = normalizeNonNegativeMetric(value, provenance);
    if (metric.status !== 'supported')
        return metric;
    if (metric.value === 0)
        return unverifiedMetric();
    return metric;
}
export function normalizeNonNegativeIntegerMetric(value, provenance) {
    const metric = normalizeNonNegativeMetric(value, provenance);
    if (metric.status !== 'supported')
        return metric;
    if (!Number.isInteger(metric.value))
        return unverifiedMetric();
    return metric;
}
export function normalizePositiveIntegerMetric(value, provenance) {
    const metric = normalizePositiveMetric(value, provenance);
    if (metric.status !== 'supported')
        return metric;
    if (!Number.isInteger(metric.value))
        return unverifiedMetric();
    return metric;
}
export function normalizeUtilizationMetric(value, provenance) {
    const metric = normalizeNonNegativeMetric(value, provenance);
    if (metric.status !== 'supported')
        return metric;
    if (metric.value > 1)
        return unverifiedMetric();
    return metric;
}
export function normalizeEnumMetric(value, allowedValues, provenance) {
    if (value === undefined || value === null)
        return unavailableMetric();
    if (typeof value !== 'number' || !Number.isInteger(value) || !allowedValues.includes(value)) {
        return unverifiedMetric();
    }
    return { status: 'supported', value, provenance };
}
export function normalizeStringMetric(value, provenance) {
    if (value === undefined || value === null)
        return unavailableMetric();
    if (typeof value !== 'string' || value.length === 0)
        return unverifiedMetric();
    return { status: 'supported', value, provenance };
}
export function normalizeBooleanMetric(value, provenance) {
    if (value === undefined || value === null)
        return unavailableMetric();
    if (typeof value !== 'boolean')
        return unverifiedMetric();
    return { status: 'supported', value, provenance };
}
