// filepath: src/pages/SceneExpansionPage.tsx
import React, { useEffect, useState } from 'react'
import { expandScene, fetchExpansionFacts } from '../api/scene_expansion'
import { listWorlds } from '../api/worlds'
import { listScenes } from '../api/scenes'
import { listConflicts } from '../api/conflicts'
import ScenePreview from '../components/ScenePreview'
import ConflictPreview from '../components/ConflictPreview'
import type { World } from '../types/world'
import type { Scene } from '../types/scene'
import type { Conflict } from '../types/conflict'
import type { ExpandedScriptSummary } from '../api/scene_expansion'
import { Form, Select, Button, Alert, Spin, Modal } from 'antd'
import { listTopicsForWorld } from '../api/topics'
import { listTopicTemplates } from '../api/topic_templates'
import StyledTable from '../components/StyledTable'
import { Space } from 'antd'
import { createSessionForScript } from '../api/engine'
import { notification } from 'antd'
import { listRolePairs } from '../api/rolePairs'
import { listWorldRolePairRulesForWorld } from '../api/worldRolePairRules'
import { listWorldArchetypeRulesForWorld } from '../api/worldArchetypeRules'
import { listConflictArchetypes, listEnabledConflictArchetypes } from '../api/conflictArchetypes'
import { listConflictEscalationSkeletons } from '../api/conflictEscalationSkeletons'
import { post } from '../api/http'
import styles from './SceneExpansion.module.css'
import tableStyles from '../components/Table.module.css'
import SceneList from './SceneList'
import WorldSelector from './WorldSelector'

// Lightweight fallbacks when original pages were removed from disk (keeps SceneExpansionPage functional).
const ConflictTemplatesPage: React.FC = () => (
    <div style={{ padding: 12, border: '1px dashed #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Conflict Templates (placeholder)</div>
        <div style={{ color: '#6b7280' }}>Conflict management UI not available in this build. Restore `src/pages/ConflictTemplatesPage.tsx` to enable full functionality.</div>
    </div>
)

const TopicTemplatesPage: React.FC<{ worldKey?: string }> = ({ worldKey }) => (
    <div style={{ padding: 12, border: '1px dashed #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Topic Templates (placeholder)</div>
        <div style={{ color: '#6b7280' }}>{worldKey ? `No topic templates available for world ${worldKey}.` : 'No world selected.'}</div>
    </div>
)

export default function SceneExpansionPage({ navigateToConversationFromScene }: { navigateToConversationFromScene?: (sceneKey: string, initialSession?: any) => void }): JSX.Element {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ scene_key: string; conflict_key: string; version: number } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [resourcesLoading, setResourcesLoading] = useState<boolean>(false)

    const [worlds, setWorlds] = useState<World[]>([])
    const [displayedScenes, setDisplayedScenes] = useState<Scene[]>([])
    const [displayedConflicts, setDisplayedConflicts] = useState<Conflict[]>([])
    // keep raw lists so we can derive filtered views when world changes
    const [rawScenes, setRawScenes] = useState<Scene[]>([])
    const [rawConflicts, setRawConflicts] = useState<Conflict[]>([])
    const [rawTopics, setRawTopics] = useState<any[]>([])
    const [rolePairs, setRolePairs] = useState<any[]>([])
    const [selectedRolePair, setSelectedRolePair] = useState<number | undefined>(undefined)
    const [allowedRolePairs, setAllowedRolePairs] = useState<any[]>([])

    const [selectedWorld, setSelectedWorld] = useState<string | undefined>(undefined)
    const [selectedSceneTemplate, setSelectedSceneTemplate] = useState<string | undefined>(undefined)
    const [selectedConflict, setSelectedConflict] = useState<string | undefined>(undefined)
    const [topics, setTopics] = useState<any[]>([])
    const [topicsCache, setTopicsCache] = useState<Record<string, any[]>>({})
    // topic selection may be numeric id or string key depending on backend; allow both
    const [selectedTopicId, setSelectedTopicId] = useState<number | string | undefined>(undefined)

    const [expansionFacts, setExpansionFacts] = useState<ExpandedScriptSummary[]>([])
    const [factsError, setFactsError] = useState<string | null>(null)

    const [genOpen, setGenOpen] = useState(false)
    const [archetypes, setArchetypes] = useState<any[]>([])
    const [skeletons, setSkeletons] = useState<any[]>([])
    const [genLoading, setGenLoading] = useState(false)
    const [selectedArchetype, setSelectedArchetype] = useState<string | undefined>(undefined)
    const [selectedSkeletonId, setSelectedSkeletonId] = useState<number | undefined>(undefined)
    const [selectedRolePairId, setSelectedRolePairId] = useState<number | undefined>(undefined)

    const [form] = Form.useForm()

    useEffect(() => {
        let mounted = true
        setResourcesLoading(true)
        // Wrap resource loads in Promise.all; do not call listTopicsForWorld('') with an empty world key.
        Promise.all([
            listWorlds(),
            listScenes(),
            listConflicts(),
            listRolePairs()
        ])
            .then(([w, s, c, rp]) => {
                if (!mounted) return
                setWorlds(w)
                // store raw lists; do not populate selectors until world selected
                setRawScenes(s)
                setRawConflicts(c)
                setRolePairs(rp || [])
                // do not preload topics without a selected world; keep cache empty
                setRawTopics([])
            })
            .catch(() => {
                // ignore errors for resources, keep arrays empty
            })
            .finally(() => { if (mounted) setResourcesLoading(false) })
        return () => { mounted = false }
    }, [])

    // Ensure worlds are loaded even if the combined Promise.all had an issue.
    useEffect(() => {
        let mounted = true
        listWorlds()
            .then(w => { if (!mounted) return; console.log('[SceneExpansionPage] fallback listWorlds:', w); setWorlds(w || []) })
            .catch(err => { console.warn('[SceneExpansionPage] fallback listWorlds failed', err) })
        return () => { mounted = false }
    }, [])

    // Minimal debug logs requested: do not change business logic, only log values.
    useEffect(() => {
        // Log scenes after they are loaded/updated
        try {
            console.log('[SceneExpansion] scenes:', rawScenes)
        } catch (e) {
            /* noop */
        }
    }, [rawScenes])

    useEffect(() => {
        // Log when selected world changes
        try {
            console.log('[SceneExpansion] selectedWorld:', selectedWorld)
        } catch (e) {
            /* noop */
        }
    }, [selectedWorld])

    useEffect(() => {
        // Log displayed scenes after computation
        try {
            console.log('[SceneExpansion] displayedScenes:', displayedScenes)
        } catch (e) {
            /* noop */
        }
    }, [displayedScenes])

    useEffect(() => {
        // when world changes, reset selections
        setSelectedSceneTemplate(undefined)
        setSelectedConflict(undefined)
        setSelectedRolePair(undefined)

        // Minimal diagnostic logs for world->scene matching (no logic changes)
        try { console.log('[SceneExpansion] worlds:', worlds) } catch (e) { /* noop */ }
        try { console.log('[SceneExpansion] selectedWorld:', selectedWorld) } catch (e) { /* noop */ }

        // If no world selected => clear displayed lists and disable selectors
        if (!selectedWorld) {
            setDisplayedScenes([])
            setDisplayedConflicts([])
            return
        }

        // determine numeric world id if available from loaded worlds
        const worldObj = worlds.find(w => (w as any).key === selectedWorld)
        const worldId = worldObj ? (worldObj as any).id : undefined

        try { console.log('[SceneExpansion] worldObj:', worldObj, 'worldId:', worldId) } catch (e) { /* noop */ }
        try { console.log('[SceneExpansion] rawScenesCount:', rawScenes.length, 'sampleScene:', rawScenes[0]) } catch (e) { /* noop */ }

        // Scenes: match by the first segment of scene.key (world key) instead of numeric world_id.
        // Backend worlds may not include numeric id; do not rely on world_id for filtering.
        try {
            const scenesForWorld: Scene[] = rawScenes.filter((s: any) => {
                const sceneKey = (s as any).key ?? ''
                const sceneWorldKey = String(sceneKey).split('.')?.[0]
                return sceneWorldKey === selectedWorld
            })
            try { console.log('[SceneExpansion] computedScenesForWorld:', scenesForWorld) } catch (e) { /* noop */ }
            setDisplayedScenes(scenesForWorld)
            try { console.log('[SceneExpansion] displayedScenes:', scenesForWorld) } catch (e) { /* noop */ }
        } catch (e) {
            console.error('[SceneExpansionPage] failed to filter scenes by world key', e)
            setDisplayedScenes([])
        }

        // Conflicts: load authoritative world-archetype rules and allow only conflicts whose metadata.archetype_key is allowed
        ; (async () => {
            try {
                // 1) archetype rules (existing)
                const rules = await listWorldArchetypeRulesForWorld(selectedWorld)
                const allowedArchetypes: string[] = (rules || [])
                    .filter((r: any) => r && (r.allowed === true || r.allowed === 'true'))
                    .map((r: any) => String(r.archetype_key))

                console.debug('[SceneExpansionPage] archetype rules.length=', (rules || []).length, 'allowedArchetypes=', allowedArchetypes)

                // 2) world role-pair rules (new)
                let wpRules: any[] = []
                try {
                    wpRules = await listWorldRolePairRulesForWorld(selectedWorld)
                } catch (e) {
                    // network or 404 - treat as empty
                    console.warn('[SceneExpansionPage] failed to load world_role_pair_rules for', selectedWorld, e)
                    wpRules = []
                }

                const allowedRolePairIds: number[] = (wpRules || [])
                    .filter((r: any) => r && (r.allowed === true || r.allowed === 'true'))
                    .map((r: any) => Number(r.role_pair_id))

                console.log('[Expansion] allowedRolePairIds:', allowedRolePairIds)
                console.log('[Expansion] sample conflict:', rawConflicts[0])

                // if no allowed archetypes -> no conflicts
                if (!allowedArchetypes.length) {
                    setDisplayedConflicts([])
                    return
                }

                // if allowedRolePairIds is empty -> per spec, filter out all conflicts
                if (!allowedRolePairIds.length) {
                    setDisplayedConflicts([])
                    return
                }

                // Build allowed rolePairs list for UI options
                const allowedRPs = (rolePairs || []).filter((rp: any) => allowedRolePairIds.includes(Number(rp.id)))
                setAllowedRolePairs(allowedRPs)

                // 3) filter conflicts: first by archetype, then by role-pair gate
                let conflictsForWorld: Conflict[] = rawConflicts.filter((c: any) => {
                    const meta = c && (c as any).metadata
                    const arche = meta ? (meta.archetype_key ?? meta.archetype) : undefined
                    if (!arche) return false
                    return allowedArchetypes.includes(String(arche))
                })

                conflictsForWorld = conflictsForWorld.filter((c: any) => {
                    // if user selected a specific role pair, require it
                    if (selectedRolePair != null) {
                        // check metadata first
                        const metaRpId = c?.metadata?.role_pair_id
                        if (metaRpId != null) return Number(metaRpId) === Number(selectedRolePair)
                        // fallback: match by roles to find rp id
                        const initiator = c?.roles?.initiator
                        const responder = c?.roles?.responder
                        if (!initiator || !responder) return false
                        const rp = rolePairs.find((r: any) => r.initiator_role === initiator && r.responder_role === responder)
                        if (!rp) return false
                        return Number(rp.id) === Number(selectedRolePair)
                    }

                    // no user selection -> apply world gate
                    return isConflictAllowedInWorld(c, allowedRolePairIds, rolePairs)
                })

                console.debug('[SceneExpansionPage] rawConflicts=', rawConflicts.length, 'conflictsForWorld=', conflictsForWorld.length)

                setDisplayedConflicts(conflictsForWorld)
            } catch (err) {
                console.error('[SceneExpansionPage] failed to load world archetype rules or filter conflicts', err)
                setDisplayedConflicts([])
            }
        })()

    }, [selectedWorld, rawScenes, rawConflicts, worlds])

    // include selectedRolePair and rolePairs so filtering updates when user selects RP
    // note: the effect above will re-run when selectedRolePair or rolePairs change because they are used via closure; to be safe we add a lightweight effect to recompute displayedConflicts when selectedRolePair changes
    useEffect(() => {
        // trigger re-filter by toggling selectedWorld to same value (cheap) if a world is selected
        if (selectedWorld) setSelectedWorld(selectedWorld)
    }, [selectedRolePair, rolePairs])

    async function handleGenerate(formValues?: any) {
        // Ant Design Form onFinish passes form values; prefer those values when available.
        const world = formValues?.world ?? selectedWorld
        const sceneTemplate = formValues?.scene ?? selectedSceneTemplate
        const conflictKey = formValues?.conflict ?? selectedConflict
        const rolePairVal = formValues?.role_pair ?? selectedRolePair

        console.log('[SceneExpansion] handleGenerate invoked', { formValues, world, sceneTemplate, conflictKey, rolePairVal })

        setError(null)
        setResult(null)
        setFactsError(null)
        setExpansionFacts([])
        if (!world || !sceneTemplate || !conflictKey) {
            setError('Please select world, scene template and conflict before generating.')
            return
        }

        setLoading(true)
        try {
            // Defensive assertion: require a dot-separated scene.key as provided by the Scene List API.
            // Do NOT attempt to transform or guess a missing/incorrect format (no underscore->dot conversions).
            const sceneKey = String(sceneTemplate)
            if (!sceneKey || !sceneKey.includes('.')) {
                const msg = `Invalid scene_key format: ${sceneKey}. The frontend requires the dot-separated scene.key from the Scene List API (e.g. world.location.index).`
                console.error('[SceneExpansionPage] aborting expand, invalid scene_key format', sceneKey)
                setError(msg)
                setLoading(false)
                return
            }

            const payload: any = { scene_key: sceneTemplate, conflict_key: conflictKey, world_key: world }
            // Only include numeric topic_id. If backend returns only string keys, do not send object/description.
            if (typeof selectedTopicId === 'number') payload.topic_id = selectedTopicId
            console.log('[SceneExpansion] calling expandScene with payload:', payload)
            const res = await expandScene(payload)
            const { scene_key, conflict_key, version } = res
            console.log('Scene expansion result:', { scene_key, conflict_key, version })
            setResult({ scene_key, conflict_key, version })

            // Immediately fetch expansion facts for the template scene_key
            try {
                const facts = await fetchExpansionFacts(String(selectedSceneTemplate))
                setExpansionFacts(facts)
            } catch (err: any) {
                console.error('[SceneExpansionPage] fetchExpansionFacts failed', err)
                setFactsError('Expansion facts not available yet—DB migration or indexing may be pending.')
            }
        } catch (err: any) {
            console.error('[SceneExpansionPage] expand failed', err)
            setError((err && (err.message || JSON.stringify(err))) || String(err))
        } finally {
            setLoading(false)
        }
    }

    async function handleViewInList() {
        if (!result) return
        // If App provided navigation helper, use it to pass the initialSession later
        if (navigateToConversationFromScene) {
            navigateToConversationFromScene(result.scene_key, undefined)
            return
        }
        // Otherwise, fallback: open scenes view by setting window.history state (legacy)
        try {
            window.history.pushState({ sceneKey: result.scene_key }, '', '')
            window.location.reload()
        } catch {
            // ignore
        }
    }

    // Helper: determine if a conflict is allowed by role_pair gate
    function isConflictAllowedInWorld(conflict: any, allowedRolePairIds: number[], rolePairsList: any[]): boolean {
        // Priority: metadata.role_pair_id
        const metaRpId = conflict?.metadata?.role_pair_id
        if (metaRpId != null) return allowedRolePairIds.includes(Number(metaRpId))

        // Fallback: match by roles
        const initiator = conflict?.roles?.initiator
        const responder = conflict?.roles?.responder
        if (!initiator || !responder) return false

        const rp = rolePairsList.find((r: any) => r.initiator_role === initiator && r.responder_role === responder)
        if (!rp) return false
        return allowedRolePairIds.includes(Number(rp.id))
    }

    async function fetchTopicTemplatesForWorld(worldKey?: string) {
        if (!worldKey) return
        // return cached if present
        if (topicsCache && (topicsCache as any)[worldKey]) {
            setTopics((topicsCache as any)[worldKey])
            return
        }
        try {
            // call the backend world-scoped endpoint explicitly
            const t = await listTopicTemplates(worldKey)
            setTopics(t || [])
            setTopicsCache(prev => ({ ...(prev || {}), [worldKey]: t || [] }))
        } catch (err) {
            console.warn('[SceneExpansionPage] fetchTopicTemplatesForWorld failed for', worldKey, err)
            setTopics([])
        }
    }

    // Preload generator lists (archetypes, skeletons) so modal opens quickly
    async function loadGenerators() {
        try {
            // use enabled archetypes endpoint for the top dropdown
            const [a, s] = await Promise.all([
                listEnabledConflictArchetypes(),
                listConflictEscalationSkeletons(),
            ])
            setArchetypes(a || [])
            setSkeletons(s || [])
        } catch (e) {
            console.warn('[SceneExpansionPage] loadGenerators failed', e)
            setArchetypes([])
            setSkeletons([])
        }
    }

    useEffect(() => {
        loadGenerators()
    }, [])

    return (
        <div className={styles.container}>
            <h2>Scene Expansion (Director)</h2>

            <Spin spinning={resourcesLoading || loading}>
                <Form form={form} layout="vertical" className={styles.formVertical} onFinish={handleGenerate} initialValues={{}}>
                    <div className={styles.rowTwo}>
                        <Form.Item name="world" label="World" rules={[{ required: true, message: 'Select a world' }]} style={{ margin: 0 }}>
                            <Select showSearch className={styles.fullWidth} placeholder="Select world" value={selectedWorld} onChange={(v) => setSelectedWorld(v)} filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())}>
                                {worlds.map(w => (<Select.Option key={(w as any).key} value={(w as any).key} label={`${(w as any).name} (${(w as any).key})`}>{(w as any).name} ({(w as any).key})</Select.Option>))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="role_pair" label="Role Pair" style={{ margin: 0 }}>
                            <Select disabled={!selectedWorld || allowedRolePairs.length === 0} className={styles.select320} placeholder="(all allowed)" value={selectedRolePair} onChange={(v) => setSelectedRolePair(v as any)} allowClear>
                                {allowedRolePairs.map((rp: any) => (<Select.Option key={rp.id} value={rp.id} label={`${rp.initiator_role} → ${rp.responder_role}`}>{rp.initiator_role} → {rp.responder_role} (id:{rp.id})</Select.Option>))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="scene" label="Scene Template" rules={[{ required: true, message: 'Select a scene' }]}>
                        <Select disabled={!selectedWorld} showSearch className={styles.fullWidth} placeholder="Select scene template" value={selectedSceneTemplate} onChange={(v) => setSelectedSceneTemplate(v)} filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())}>
                            {displayedScenes.map(s => (<Select.Option key={(s as any).key} value={(s as any).key} label={`${(s as any).title} (${(s as any).key})`}>{(s as any).title} ({(s as any).key})</Select.Option>))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="conflict" label="Conflict" rules={[{ required: true, message: 'Select a conflict' }]}>
                        <Select disabled={!selectedWorld} showSearch className={styles.fullWidth} placeholder="Select conflict" value={selectedConflict} onChange={(v) => setSelectedConflict(v)} filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())}>
                            {/* Use displayedConflicts (actual conflict templates) so value is conflict.key */}
                            {displayedConflicts.map((c: any) => (
                                <Select.Option key={c.key} value={c.key} label={c.key}>
                                    {c.key}{c.short_desc ? ` — ${c.short_desc}` : (c.category ? ` — ${c.category}` : '')}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="topic" label="Topic" tooltip="Optional: select a topic to ground prompt generation">
                        <Select
                            disabled={!selectedWorld}
                            showSearch
                            className={styles.fullWidth}
                            placeholder="(optional) select topic"
                            value={selectedTopicId}
                            onChange={(v) => setSelectedTopicId(v as any)}
                            onDropdownVisibleChange={(open) => { if (open && selectedWorld) fetchTopicTemplatesForWorld(selectedWorld) }}
                            onFocus={() => { if (selectedWorld && (!topics || topics.length === 0)) fetchTopicTemplatesForWorld(selectedWorld) }}
                            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(String(input).toLowerCase())}
                            allowClear
                        >
                            {topics.map(t => {
                                const desc = t.description ?? t.notes ?? ''
                                return (
                                    // use numeric id when available, otherwise fallback to key
                                    <Select.Option key={t.id ?? t.key} value={t.id ?? t.key} label={`${t.title}${desc ? ` — ${String(desc).slice(0, 60)}` : ''}`}>
                                        {t.title}{desc ? ` — ${String(desc).slice(0, 120)}` : ''}
                                    </Select.Option>
                                )
                            })}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading} onClick={() => console.log('[SceneExpansion] Generate button clicked')}>
                                {loading ? 'Generating...' : 'Generate Scene'}
                            </Button>
                            {result && (
                                <>
                                    <Button onClick={handleViewInList}>View in Scene List</Button>
                                </>
                            )}
                        </Space>
                    </Form.Item>
                </Form>

                {error && <Alert type="error" message={error} className={styles.alertMb} />}

                <div className={styles.previewWrapper}>
                    {/* Scene preview and conflict preview shown inline */}
                    <div className={styles.previewGrid}>
                        <div>
                            <ScenePreview sceneKey={selectedSceneTemplate} />
                        </div>
                        <div>
                            <ConflictPreview conflictKey={selectedConflict} />
                        </div>
                    </div>

                    {/* Full management UIs (migrated from their original pages) */}
                    <div className={styles.listSection}>
                        <h3>Manage Scenes</h3>
                        <SceneList worldKey={selectedWorld} />
                    </div>

                    <div className={styles.listSection}>
                        <h3>Manage Conflict Templates</h3>
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={() => setGenOpen(true)}>Generate Conflict Template (admin)</Button>
                        </div>
                        <ConflictTemplatesPage />

                        <Modal title="Generate Conflict Template" open={genOpen} onCancel={() => setGenOpen(false)} footer={null} destroyOnClose>
                            <div style={{ display: 'grid', gap: 12, minWidth: 420 }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>Conflict Archetype</div>
                                    <select value={selectedArchetype ?? ''} onChange={(e) => setSelectedArchetype(e.target.value)} style={{ width: '100%', padding: 8 }}>
                                        <option value="">-- select archetype --</option>
                                        {archetypes.map((a: any) => (
                                            <option key={a.key} value={a.key}>{a.key} {a.category ? `(${a.category})` : ''} {a.short_desc ? `- ${a.short_desc}` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div style={{ fontWeight: 700 }}>Escalation Skeleton</div>
                                    <select value={selectedSkeletonId ?? ''} onChange={(e) => setSelectedSkeletonId(e.target.value ? Number(e.target.value) : undefined)} style={{ width: '100%', padding: 8 }}>
                                        <option value="">-- select skeleton --</option>
                                        {skeletons.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.id} {s.archetype_key ? `(${s.archetype_key})` : ''} {s.tone ? `- ${s.tone}` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div style={{ fontWeight: 700 }}>Role Pair</div>
                                    <select value={selectedRolePairId ?? ''} onChange={(e) => setSelectedRolePairId(e.target.value ? Number(e.target.value) : undefined)} style={{ width: '100%', padding: 8 }}>
                                        <option value="">-- select role pair --</option>
                                        {rolePairs.map((r: any) => (
                                            <option key={r.id} value={r.id}>{r.id}: {r.initiator_role} → {r.responder_role} {r.relation_type ? `(${r.relation_type})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <Button onClick={() => setGenOpen(false)}>Cancel</Button>
                                    <Button type="primary" loading={genLoading} onClick={async () => {
                                        if (!selectedArchetype || !selectedSkeletonId || !selectedRolePairId) {
                                            alert('Please select archetype, skeleton and role pair')
                                            return
                                        }
                                        setGenLoading(true)
                                        try {
                                            const payload = {
                                                archetype_key: selectedArchetype,
                                                escalation_skeleton_id: selectedSkeletonId,
                                                role_pair_id: selectedRolePairId,
                                            }
                                            await post('/admin/conflict-templates/generate', payload)
                                            setGenOpen(false)
                                            // refresh conflict templates list by reloading displayedConflicts from rawConflicts
                                            // call listConflicts to refresh rawConflicts and recompute displayedConflicts
                                            const fresh = await listConflicts()
                                            setRawConflicts(fresh || [])
                                        } catch (e) {
                                            console.error('generation failed', e)
                                            alert('Generation failed: ' + (e instanceof Error ? e.message : String(e)))
                                        } finally {
                                            setGenLoading(false)
                                        }
                                    }}>Generate</Button>
                                </div>
                            </div>
                        </Modal>
                    </div>

                    <div className={styles.listSection}>
                        <h3>Manage Topic Templates</h3>
                        <TopicTemplatesPage worldKey={selectedWorld} />
                    </div>
                </div>

                {factsError && <Alert type="error" message={factsError} className={styles.alertTop} />}

                {expansionFacts.length > 0 && (
                    <div className={styles.tableWrapper}>
                        <h3>Expanded Scene Facts (Newly Generated Scripts)</h3>
                        <StyledTable
                            dataSource={expansionFacts}
                            rowKey={(r: any, idx?: number) => r.script_mongo_id ?? String(idx ?? 0)}
                            columns={[
                                { title: 'Script Mongo ID', dataIndex: 'script_mongo_id', key: 'script_mongo_id', render: (v: any) => <code>{v}</code> },
                                { title: 'Conflict Key', dataIndex: 'conflict_key', key: 'conflict_key', render: (v: any) => v ?? '-' },
                                { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (v: any) => v ?? '-' },
                                {
                                    title: 'Action', key: 'action', render: (_: any, f: any) => (
                                        <div className={tableStyles.actionCell}>
                                            {f.script_mongo_id ? (
                                                <Button size="small" onClick={async () => {
                                                    try {
                                                        const res = await createSessionForScript(String(f.script_mongo_id))
                                                        if (navigateToConversationFromScene) {
                                                            navigateToConversationFromScene(result?.scene_key ?? String(selectedSceneTemplate ?? ''), res)
                                                        } else {
                                                            try { window.location.href = '/'; } catch { }
                                                        }
                                                    } catch (err: any) {
                                                        console.error('[SceneExpansionPage] start by script failed', err)
                                                        const msg = (err && ((err.body && (err.body.error || err.body.message)) || err.message)) || String(err)
                                                        notification.error({ message: 'Start by script failed', description: msg })
                                                    }
                                                }}>Start Script</Button>
                                            ) : (
                                                <Button size="small" disabled>Start (missing script_mongo_id)</Button>
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                            pagination={false}
                        />
                    </div>
                )}
            </Spin>
        </div>
    )
}
