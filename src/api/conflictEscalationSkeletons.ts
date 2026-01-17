import { get, post, put, del } from './http'

export interface NewConflictEscalationSkeleton {
    archetype_key: string
    tone: string
    stages: any
}

export interface ConflictEscalationSkeleton {
    id: number
    archetype_key: string
    tone: string
    stages: any
    created_at?: string
    updated_at?: string
}

export async function listConflictEscalationSkeletons(params?: Record<string, any>): Promise<ConflictEscalationSkeleton[]> {
    return get('/services/conflict_escalation_skeletons', params)
}

export async function getConflictEscalationSkeleton(id: number): Promise<ConflictEscalationSkeleton> {
    return get(`/services/conflict_escalation_skeletons/${encodeURIComponent(String(id))}`)
}

export async function listConflictEscalationSkeletonsByArchetype(archetype_key: string): Promise<ConflictEscalationSkeleton[]> {
    return get(`/services/conflict_escalation_skeletons/by_archetype/${encodeURIComponent(archetype_key)}`)
}

export async function createConflictEscalationSkeleton(payload: NewConflictEscalationSkeleton): Promise<ConflictEscalationSkeleton> {
    return post('/services/conflict_escalation_skeletons', payload)
}

export async function updateConflictEscalationSkeleton(id: number, payload: ConflictEscalationSkeleton): Promise<ConflictEscalationSkeleton> {
    return put(`/services/conflict_escalation_skeletons/${encodeURIComponent(String(id))}`, payload)
}

export async function deleteConflictEscalationSkeleton(id: number): Promise<void> {
    return del(`/services/conflict_escalation_skeletons/${encodeURIComponent(String(id))}`)
}
