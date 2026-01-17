//src/api/scenes.ts
import { Scene } from '../types/scene'
import { del, get, post, put } from './http'
import type { SceneSummary } from '../types/sceneSummary'

export function listScenes(): Promise<Scene[]> {
    return get<Scene[]>('/services/scenes')
}

export function listScenesByWorld(worldKey: string): Promise<SceneSummary[]> {
    return get<SceneSummary[]>(`/services/api/worlds/${encodeURIComponent(worldKey)}/scenes`)
}

export function getScene(key: string): Promise<Scene> {
    return get<Scene>(`/services/scene/${encodeURIComponent(key)}`)
}

export function createScene(scene: Scene): Promise<Scene> {
    return post<Scene>('/services/scene', scene)
}

export function updateScene(key: string, patch: Partial<Scene>): Promise<Scene> {
    return put<Scene>(`/services/scene/${encodeURIComponent(key)}`, patch)
}

export function deleteScene(key: string): Promise<void> {
    return del<void>(`/services/scene/${encodeURIComponent(key)}`)
}

