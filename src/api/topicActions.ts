import { get, post, put, del } from './http'

export async function listTopicActionsForTopic(topicKey: string) {
    return await get(`/services/topics/${encodeURIComponent(topicKey)}/topic_actions`)
}

export async function getTopicAction(id: number) {
    return await get(`/services/topic_actions/${encodeURIComponent(String(id))}`)
}

export async function createTopicAction(payload: any) {
    return await post('/services/topic_actions', payload)
}

export async function updateTopicAction(id: number, payload: any) {
    return await put(`/services/topic_actions/${encodeURIComponent(String(id))}`, payload)
}

export async function deleteTopicAction(id: number) {
    return await del(`/services/topic_actions/${encodeURIComponent(String(id))}`)
}
