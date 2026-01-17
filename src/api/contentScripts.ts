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
    try {
        const res = await get('/services/content/scripts', params)
        console.log('[api.contentScripts] GET /services/content/scripts ->', res)
        // If backend returns an empty list but we expect data, attempt fallback path
        if (Array.isArray(res) && res.length === 0) {
            // try alternate mount
            try {
                const alt = await get('/content/scripts', params)
                console.log('[api.contentScripts] fallback GET /content/scripts ->', alt)
                return alt
            } catch (e) {
                // ignore fallback errors
            }
        }
        return res
    } catch (err) {
        console.warn('[api.contentScripts] primary GET failed, attempting fallback /content/scripts', err)
        try {
            const alt = await get('/content/scripts', params)
            console.log('[api.contentScripts] fallback GET /content/scripts ->', alt)
            return alt
        } catch (e) {
            throw err
        }
    }
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
    try {
        const res = await get('/services/content/scripts/summaries', params)
        console.log('[api.contentScripts] GET /service/content/scripts/summaries ->', res)
        // If backend returns an empty list try alternate mounts
        if (Array.isArray(res) && res.length === 0) {
            try {
                const alt = await get('/services/content/scripts/summaries', params)
                console.log('[api.contentScripts] fallback GET /services/content/scripts/summaries ->', alt)
                return alt
            } catch (e) {
                // ignore
            }
        }
        return res
    } catch (err) {
        console.warn('[api.contentScripts] primary summaries GET failed, attempting fallbacks', err)
        try {
            const alt = await get('/services/content/scripts/summaries', params)
            console.log('[api.contentScripts] fallback GET /services/content/scripts/summaries ->', alt)
            return alt
        } catch (e) {
            try {
                const alt2 = await get('/content/scripts/summaries', params)
                console.log('[api.contentScripts] fallback GET /content/scripts/summaries ->', alt2)
                return alt2
            } catch (e2) {
                throw err
            }
        }
    }
}

export async function listContentScriptAssets(params?: Record<string, any>) {
    try {
        const res = await get('/services/content/scripts/assets', params)
        console.log('[api.contentScripts] GET /service/content/scripts/assets ->', res)
        if (Array.isArray(res) && res.length === 0) {
            try {
                const alt = await get('/services/content/scripts/assets', params)
                console.log('[api.contentScripts] fallback GET /services/content/scripts/assets ->', alt)
                return alt
            } catch (e) {
                // ignore
            }
        }
        return res
    } catch (err) {
        console.warn('[api.contentScripts] primary assets GET failed, attempting fallbacks', err)
        try {
            const alt = await get('/services/content/scripts/assets', params)
            console.log('[api.contentScripts] fallback GET /services/content/scripts/assets ->', alt)
            return alt
        } catch (e) {
            try {
                const alt2 = await get('/content/scripts/assets', params)
                console.log('[api.contentScripts] fallback GET /content/scripts/assets ->', alt2)
                return alt2
            } catch (e2) {
                throw err
            }
        }
    }
}
