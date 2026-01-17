import { get, post, put, del } from './http'

export interface SceneConflictLink {
    id?: number
    scene_key: string
    conflict_key: string
    priority?: number
    is_active?: boolean
    script_mongo_id?: string | null
    metadata?: any
    created_at?: string
    updated_at?: string
}

// Existing id-based CRUD (used by some pages)
export function listLinks(): Promise<SceneConflictLink[]> {
    return get('/services/scene_conflict_links')
}

export function createLink(payload: Partial<SceneConflictLink>): Promise<SceneConflictLink> {
    return post('/services/scene_conflict_links', payload)
}

export function updateLink(id: number, payload: Partial<SceneConflictLink>): Promise<SceneConflictLink> {
    return put(`/services/scene_conflict_links/${encodeURIComponent(String(id))}`, payload)
}

export function deleteLink(id: number): Promise<void> {
    return del(`/services/scene_conflict_links/${encodeURIComponent(String(id))}`)
}

// Additional helpers that align with the server routes described in the DB summary.
// These operate with scene_key/conflict_key payloads or query params.

export function listLinksByScene(scene_key: string): Promise<SceneConflictLink[]> {
    return get(`/services/scene_conflict_links?scene_key=${encodeURIComponent(scene_key)}`)
}

export interface CreateLinkByKeyPayload {
    scene_key: string
    conflict_key: string
    priority?: number
    is_active?: boolean
    script_mongo_id?: string | null
    metadata?: any
}

export function createLinkByKey(payload: CreateLinkByKeyPayload): Promise<SceneConflictLink> {
    return post('/services/scene_conflict_links', payload)
}

export interface UpdatePriorityByKeyReq {
    scene_key: string
    conflict_key: string
    priority: number
}

export function updatePriorityByKey(payload: UpdatePriorityByKeyReq) {
    // server route: PUT /scene_conflict_links/priority
    return put('/services/scene_conflict_links/priority', payload)
}

export interface SetActiveByKeyReq {
    scene_key: string
    conflict_key: string
    is_active: boolean
}

export function setActiveByKey(payload: SetActiveByKeyReq) {
    // server route: PUT /scene_conflict_links/active
    return put('/services/scene_conflict_links/active', payload)
}

export interface DeleteByKeyReq {
    scene_key: string
    conflict_key: string
}

export function deleteByKey(payload: DeleteByKeyReq) {
    // server route: DELETE /scene_conflict_links with body
    // If your http.del doesn't accept a body, change this to post('/services/scene_conflict_links/delete', payload) or similar.
    return del('/services/scene_conflict_links', payload as any)
}
