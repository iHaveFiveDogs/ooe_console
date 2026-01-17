import { get, post, put, del } from './http'

export interface NewRolePair {
    initiator_role: string
    responder_role: string
    relation_type?: string
    power_relation?: string
    allowed_worlds?: string[]
    metadata?: any
}

export interface RolePair extends NewRolePair {
    id: number
    created_at?: string
    updated_at?: string
}

export async function listRolePairs(params?: Record<string, any>): Promise<RolePair[]> {
    return get('/services/role_pairs', params)
}

export async function getRolePair(id: number): Promise<RolePair> {
    return get(`/services/role_pairs/${encodeURIComponent(String(id))}`)
}

export async function createRolePair(payload: NewRolePair): Promise<RolePair> {
    return post('/services/role_pairs', payload)
}

export async function updateRolePair(id: number, payload: RolePair): Promise<RolePair> {
    return put(`/services/role_pairs/${encodeURIComponent(String(id))}`, payload)
}

export async function deleteRolePair(id: number): Promise<void> {
    return del(`/services/role_pairs/${encodeURIComponent(String(id))}`)
}
