import { get, post, put, del } from './http'

// List topic templates. If worldKey is provided, call the world-scoped endpoint
export async function listTopicTemplates(worldKey?: string) {
    if (!worldKey) {
        // Prevent accidental collection-level calls which some backends disallow (405).
        console.warn('[api/topic_templates] listTopicTemplates called without worldKey — refusing to call collection-level /services/topic_templates')
        throw new Error('worldKey required for listTopicTemplates to avoid collection-level /services/topic_templates request')
    }
    return await get(`/services/worlds/${encodeURIComponent(worldKey)}/topic_templates`)
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
