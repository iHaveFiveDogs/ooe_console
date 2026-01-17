import { get, post, put, del } from './http'

export interface NewWorldRolePairRule {
    world_key: string
    role_pair_id: number
    weight?: number
    allowed?: boolean
    notes?: string
}

export interface WorldRolePairRule extends NewWorldRolePairRule { id: number }

export async function listWorldRolePairRules(params?: Record<string, any>): Promise<WorldRolePairRule[]> {
    return get('/services/world_role_pair_rules', params)
}

export async function getWorldRolePairRule(id: number): Promise<WorldRolePairRule> {
    return get(`/services/world_role_pair_rules/${encodeURIComponent(String(id))}`)
}

export async function listWorldRolePairRulesForWorld(world_key: string): Promise<WorldRolePairRule[]> {
    return get(`/services/worlds/${encodeURIComponent(world_key)}/role_pair_rules`)
}

export async function createWorldRolePairRule(payload: NewWorldRolePairRule): Promise<WorldRolePairRule> {
    return post('/services/world_role_pair_rules', payload)
}

export async function updateWorldRolePairRule(id: number, payload: WorldRolePairRule): Promise<WorldRolePairRule> {
    return put(`/services/world_role_pair_rules/${encodeURIComponent(String(id))}`, payload)
}

export async function deleteWorldRolePairRule(id: number): Promise<void> {
    return del(`/services/world_role_pair_rules/${encodeURIComponent(String(id))}`)
}
