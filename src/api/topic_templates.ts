import { get, post, put, del } from './http'

// List topic templates. If worldKey is provided, call the world-scoped endpoint
export async function listTopicTemplates(worldKey?: string) {
    if (worldKey) {
        return await get(`/services/worlds/${encodeURIComponent(worldKey)}/topic_templates`)
    }
    // Fallback: attempt collection-level endpoint (may return 405 if backend doesn't expose it)
    return await get('/services/topic_templates')
}

export async function createTopicTemplate(payload: any) {
    return await post('/services/topic_templates', payload)
}

export async function updateTopicTemplate(key: string, payload: any) {
    return await put(`/services/topic_templates/${encodeURIComponent(key)}`, payload)
}

export async function deleteTopicTemplate(key: string) {
    return await del(`/services/topic_templates/${encodeURIComponent(key)}`)
}
