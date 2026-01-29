import { get, post, put, del } from './http'

export interface ScriptCreateRequest {
    script_key: string
    scene_key: string
    conflict_key?: string
    steps?: any[]
    intro_text?: string | null
    learner_role?: string | null
    learning_goal?: string | null
    version?: number
    model?: string
    created_at?: number
}

export async function listContentScripts(params?: Record<string, any>) {
    // Scene-scoped canonical endpoint for content scripts
    return get('/services/content/scripts', params)
}

export async function getContentScript(id: string) {
    return get(`/services/content/scripts/${encodeURIComponent(id)}`)
}

export async function createContentScript(payload: ScriptCreateRequest) {
    return post('/services/content/scripts', payload)
}

export async function updateContentScript(id: string, payload: ScriptCreateRequest) {
    return put(`/services/content/scripts/${encodeURIComponent(id)}`, payload)
}

export async function deleteContentScript(id: string) {
    return del(`/services/content/scripts/${encodeURIComponent(id)}`)
}

export async function listContentScriptSummaries(params?: Record<string, any>) {
    // User-facing summaries list (for List / Entry pages). Do not return full assets here.
    return get('/services/content/scripts/summaries', params)
}

export async function listContentScriptAssets(params?: Record<string, any>) {
    return get('/services/content/scripts/assets', params)
}

// User-facing single-asset getter for Detail / Chat / Training pages.
export async function getUserContentScript(id: string) {
    // Try fetching by script_key first (common for assets), then fall back to script_mongo_id.
    const endpoints = [{ q: { script_key: id } }, { q: { script_mongo_id: id } }]
    for (const e of endpoints) {
        try {
            const res = await get('/services/content/scripts/assets', e.q)
            if (!res) continue
            if (Array.isArray(res)) return res[0] || null
            if ((res as any).items && Array.isArray((res as any).items)) return (res as any).items[0] || null
            if ((res as any).data && Array.isArray((res as any).data)) return (res as any).data[0] || null
            // if backend returned a single object that's the asset
            return res
        } catch (err) {
            // continue to next attempt
        }
    }
    return null
}

// User-facing assets list (if needed elsewhere)
export async function listUserContentScriptAssets(params?: Record<string, any>) {
    return get('/services/content/scripts/assets', params)
}
