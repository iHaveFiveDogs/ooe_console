import { get, post, put, del } from './http'
import { World } from '../types/world'

export function listWorlds(params?: Record<string, any>): Promise<World[]> {
    return get<World[]>('/services/worlds', params)
}

export function getWorld(key: string): Promise<World> {
    return get<World>(`/services/world/${encodeURIComponent(key)}`)
}

export function createWorld(world: World): Promise<World> {
    return post<World>('/services/world', world)
}

export function updateWorld(key: string, patch: Partial<World>): Promise<World> {
    return put<World>(`/services/world/${encodeURIComponent(key)}`, patch)
}

export function deleteWorld(key: string): Promise<void> {
    return del<void>(`/services/world/${encodeURIComponent(key)}`)
}
