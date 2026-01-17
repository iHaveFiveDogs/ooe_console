import { post, get } from './http'

// Legacy scene-key based helpers are intentionally disabled.
// Start must use the dedicated engine start endpoint and only send { script_mongo_id }.
export function startEngine(scene_key: string, world_key?: string): Promise<any> {
    console.error('startEngine is disabled. Use createSessionForScript(script_mongo_id) which calls POST /engine/start')
    return Promise.reject(new Error('startEngine disabled'))
}

export async function createSession(scene_key: string, world_key?: string) {
    console.error('createSession is disabled. Use createSessionForScript(script_mongo_id) which calls POST /engine/start')
    throw new Error('createSession disabled')
}

export async function sendSessionInput(sessionId: string, input: string) {
    return post(`/services/engine/sessions/${encodeURIComponent(sessionId)}/input`, { input })
}

export async function createSessionForScript(script_id: string) {
    // Enforce caller provides a non-empty script_mongo_id string; do not guess or accept other id forms.
    if (!script_id || String(script_id).trim() === '' || String(script_id) === 'undefined') {
        throw new Error('createSessionForScript requires a valid script_mongo_id')
    }

    // Only send the required field and call the canonical engine start endpoint via dev proxy.
    const payload: any = { script_mongo_id: String(script_id) }
    const startPath = '/engine/start' // use relative path so Vite dev proxy forwards to backend and avoids CORS

    console.log('[engine.createSessionForScript] POST', startPath, payload)
    try {
        // Do not attempt any fallback; propagate backend errors to caller for UI to display.
        return await post(startPath, payload)
    } catch (err: any) {
        console.error('[engine.createSessionForScript] server error', {
            message: err?.message,
            status: (err as any)?.status,
            body: (err as any)?.body,
            payload,
        })
        // Re-throw so callers handle display and do not attempt fallback
        throw err
    }
}

/**
 * List available scripts for the current user.
 * If script_mongo_id is provided, the backend should filter and return matching scripts.
 * Returns an array of script summaries (shape depends on backend, e.g. { script_mongo_id, intro_text, learner_role, learning_goal }).
 */
export async function listScripts(script_mongo_id?: string) {
    const path = '/services/user/scripts'
    if (script_mongo_id) {
        return get(path, { script_mongo_id })
    }
    return get(path)
}

// Optional: helper to run CLI engine in background
export async function runCliEngine(payload: any) {
    return post('/services/engine/run-cli', payload)
}
