import { get, post, put, del } from './http'

export async function listActions(worldKey?: string) {
    if (worldKey) {
        return await get(`/services/worlds/${encodeURIComponent(worldKey)}/actions`)
    }
    return await get('/services/actions')
}

export async function getAction(actionKey: string) {
    return await get(`/services/actions/${encodeURIComponent(actionKey)}`)
}

export async function createAction(payload: any) {
    return await post('/services/actions', payload)
}

export async function updateAction(actionKey: string, payload: any) {
    return await put(`/services/actions/${encodeURIComponent(actionKey)}`, payload)
}

export async function deleteAction(actionKey: string) {
    return await del(`/services/actions/${encodeURIComponent(actionKey)}`)
}
