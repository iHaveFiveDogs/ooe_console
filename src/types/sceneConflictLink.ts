export interface SceneConflictLink {
    id: number
    scene_id: number
    conflict_id: number
    priority: number
    is_active: boolean
    metadata?: any
    script_mongo_id?: string | null
    created_at?: string | null
}
