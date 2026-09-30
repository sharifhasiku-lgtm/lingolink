export function safeTransport(transport, namespace) {
    return (level, ns, message) => {
        try {
            const result = transport(level, ns, message);
            if (result instanceof Promise) {
                result.catch((error) => {
                    console.error(`Transport error in ${namespace}:`, error); // fallback (avoid recursion)
                });
            }
        }
        catch (error) {
            console.error(`Transport error in ${namespace}:`, error); // fallback (avoid recursion)
        }
    };
}
