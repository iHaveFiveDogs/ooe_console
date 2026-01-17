import { get, post, put, del } from './http'

export interface NewRoleProfile {
    key: string
    display_name: string
    description?: string
    age_group?: string
    authority_level?: number
    emotional_baseline?: string
    communication_style?: string
    humor_tolerance?: string
    learning_role?: string
    metadata?: any
    status?: string
    difficulty_level?: string
    recommended_scenarios?: string[]
    compatible_roles?: string[]
    tags?: string[]
}

export interface RoleProfile extends NewRoleProfile {
    id: number
    created_at?: string
    updated_at?: string
}

export async function listRoles(params?: Record<string, any>): Promise<RoleProfile[]> {
    return get('/services/role', params)
}

export async function getRoleById(id: number): Promise<RoleProfile> {
    return get(`/services/role/${encodeURIComponent(String(id))}`)
}

export async function getRoleByKey(key: string): Promise<RoleProfile> {
    return get(`/services/role/key/${encodeURIComponent(key)}`)
}

export async function createRole(payload: NewRoleProfile): Promise<RoleProfile> {
    return post('/services/role', payload)
}

export async function updateRole(id: number, payload: RoleProfile): Promise<RoleProfile> {
    return put(`/services/role/${encodeURIComponent(String(id))}`, payload)
}

export async function deleteRole(id: number): Promise<void> {
    return del(`/services/role/${encodeURIComponent(String(id))}`)
}
