import { get, post, put, del } from './http'

export interface NewWorldArchetypeRule {
    world_key: string
    archetype_key: string
    weight: number
    allowed?: boolean
    notes?: string
}

export interface WorldArchetypeRule extends NewWorldArchetypeRule { id: number }

export async function listWorldArchetypeRules(params?: Record<string, any>): Promise<WorldArchetypeRule[]> {
    return get('/services/world_archetype_rules', params)
}

export async function getWorldArchetypeRule(id: number): Promise<WorldArchetypeRule> {
    return get(`/services/world_archetype_rules/${encodeURIComponent(String(id))}`)
}

export async function listWorldArchetypeRulesForWorld(world_key: string): Promise<WorldArchetypeRule[]> {
    // backend mounts this under /services as shown in routes mod.rs
    return get(`/services/worlds/${encodeURIComponent(world_key)}/archetype_rules`)
}

export async function createWorldArchetypeRule(payload: NewWorldArchetypeRule): Promise<WorldArchetypeRule> {
    return post('/services/world_archetype_rules', payload)
}

export async function updateWorldArchetypeRule(id: number, payload: WorldArchetypeRule): Promise<WorldArchetypeRule> {
    return put(`/services/world_archetype_rules/${encodeURIComponent(String(id))}`, payload)
}

export async function deleteWorldArchetypeRule(id: number): Promise<void> {
    return del(`/services/world_archetype_rules/${encodeURIComponent(String(id))}`)
}
