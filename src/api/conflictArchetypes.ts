import { get, post, put, del } from './http'

export interface ConflictArchetype {
    key: string
    category: string
    short_desc?: string
    default_tone?: string
    metadata?: any
}

export async function listConflictArchetypes(): Promise<ConflictArchetype[]> {
    return get('/services/conflict_archetypes')
}

export async function getConflictArchetype(key: string): Promise<ConflictArchetype> {
    return get(`/services/conflict_archetypes/${encodeURIComponent(key)}`)
}

export async function createConflictArchetype(payload: ConflictArchetype): Promise<ConflictArchetype> {
    return post('/services/conflict_archetypes', payload)
}

export async function updateConflictArchetype(key: string, payload: ConflictArchetype): Promise<ConflictArchetype> {
    return put(`/services/conflict_archetypes/${encodeURIComponent(key)}`, payload)
}

export async function deleteConflictArchetype(key: string): Promise<void> {
    return del(`/services/conflict_archetypes/${encodeURIComponent(key)}`)
}
