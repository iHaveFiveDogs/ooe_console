import { get } from './http'

// Use the world-scoped topic_templates service so we receive title/description/notes.
export function listTopicsForWorld(worldKey: string): Promise<any[]> {
    return get<any[]>(`/services/worlds/${encodeURIComponent(worldKey)}/topic_templates`)
        .then(res => (res || []).filter(t => String((t && t.status) || '').toLowerCase() !== 'archived'))
}

// Generic helper: if world_key provided, call the world-scoped endpoint; otherwise resolve to empty array
export function listTopics(params?: Record<string, any>): Promise<any[]> {
    if (params && params.world_key) return listTopicsForWorld(params.world_key)
    // Avoid calling unknown /api/topics collection (may 404 in some backends)
    return Promise.resolve([])
}
