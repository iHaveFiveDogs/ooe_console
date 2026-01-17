// filepath: src/api/scene_expansion.ts
import { post, get } from './http'

export interface SceneExpansionResponse {
    scene_key: string
    conflict_key: string
    version: number
}

export interface ExpandedScriptSummary {
    script_mongo_id: string
    conflict_key?: string | null
    created_at?: string
}

/**
 * Call the scene expansion endpoint. The request payload shape is not enforced here
 * (backend owns required fields). The response is expected to be the minimal shape
 * { scene_key, conflict_key, version }.
 */
export function expandScene(payload: any): Promise<SceneExpansionResponse> {
    return post<SceneExpansionResponse>('/services/scene_expansion/expand', payload)
}

/**
 * Fetch expansion facts for a given scene_key. Returns an array of summary records
 * representing newly created scripts stored in Mongo/Postgres links.
 */
export function fetchExpansionFacts(sceneKey: string): Promise<ExpandedScriptSummary[]> {
    return get<ExpandedScriptSummary[]>(`/services/scenes/${encodeURIComponent(sceneKey)}/expansion-facts`)
}
