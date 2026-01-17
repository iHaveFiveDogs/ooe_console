// src/api/conflicts.ts

import { get, post, put, del } from './http'
import type { Conflict } from '../types/conflict'

export function listConflicts(): Promise<Conflict[]> {
    return get('/services/conflicts')
}

export function getConflict(key: string): Promise<Conflict> {
    return get(`/services/conflicts/${encodeURIComponent(key)}`)
}

export function createConflict(payload: Conflict): Promise<Conflict> {
    return post('/services/conflicts', payload)
}

export function updateConflict(
    key: string,
    payload: Partial<Conflict>
): Promise<Conflict> {
    return put(`/services/conflicts/${encodeURIComponent(key)}`, payload)
}


export function deleteConflict(key: string): Promise<void> {
    return del(`/services/conflicts/${encodeURIComponent(key)}`)
}
