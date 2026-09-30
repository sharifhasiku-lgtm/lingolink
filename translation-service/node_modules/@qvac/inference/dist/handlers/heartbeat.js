export function handleHeartbeat() {
    return { type: 'heartbeat', number: Math.random() * 100 };
}
