// Lightweight logger used across the app to reduce console noise and add a stable run id.
const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
export function debug(...args: any[]) {
    try { console.debug(`[run ${RUN_ID}]`, ...args) } catch (e) { /* noop */ }
}
export function error(...args: any[]) {
    try { console.error(`[run ${RUN_ID}]`, ...args) } catch (e) { /* noop */ }
}
export function clear() {
    // Do not call console.clear() to avoid wiping useful DevTools output.
    try { console.debug(`[run ${RUN_ID}] logger initialized (console not cleared)`) } catch (e) { /* noop */ }
}
