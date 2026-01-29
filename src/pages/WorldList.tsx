import React, { useEffect, useState } from 'react'
import { listWorlds, deleteWorld } from '../api/worlds'
import WorldForm from './WorldForm'
import type { World } from '../types/world'
import { Modal, Button, Popconfirm, Select, Spin, Alert, notification, Input } from 'antd'
import StyledTable from '../components/StyledTable'
import { listConflictArchetypes, createConflictArchetype, updateConflictArchetype, deleteConflictArchetype } from '../api/conflictArchetypes'
import { listConflictEscalationSkeletons, createConflictEscalationSkeleton, updateConflictEscalationSkeleton, deleteConflictEscalationSkeleton } from '../api/conflictEscalationSkeletons'
import { listRoles, createRole, updateRole, deleteRole } from '../api/roles'
import { listRolePairs, createRolePair, updateRolePair, deleteRolePair } from '../api/rolePairs'
import { listWorldArchetypeRules, createWorldArchetypeRule, updateWorldArchetypeRule, deleteWorldArchetypeRule } from '../api/worldArchetypeRules'
import { listWorldRolePairRules, createWorldRolePairRule, updateWorldRolePairRule, deleteWorldRolePairRule } from '../api/worldRolePairRules'
import WorldRolePairRuleForm from './WorldRolePairRuleForm'
import ActionsList from './ActionsList'
import TopicActionsList from './TopicActionsList'
import { listTopicTemplates } from '../api/topic_templates'

export default function WorldList(): JSX.Element {
    const [items, setItems] = useState<World[]>([])
    const [selectedWorldKey, setSelectedWorldKey] = useState<string | undefined>()
    const [editing, setEditing] = useState<World | undefined>(undefined)
    const [creating, setCreating] = useState(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    // additional domain lists to show on world page
    const [archetypes, setArchetypes] = useState<any[]>([])
    const [archetypesLoading, setArchetypesLoading] = useState(false)
    const [skeletons, setSkeletons] = useState<any[]>([])
    const [skeletonsLoading, setSkeletonsLoading] = useState(false)
    const [roles, setRoles] = useState<any[]>([])
    const [rolesLoading, setRolesLoading] = useState(false)
    const [rolePairs, setRolePairs] = useState<any[]>([])
    const [rolePairsLoading, setRolePairsLoading] = useState(false)
    const [rules, setRules] = useState<any[]>([])
    const [rulesLoading, setRulesLoading] = useState(false)
    const [rolePairRules, setRolePairRules] = useState<any[]>([])
    const [rolePairRulesLoading, setRolePairRulesLoading] = useState(false)
    const [topics, setTopics] = useState<any[]>([])
    const [topicsLoading, setTopicsLoading] = useState<boolean>(false)
    const [selectedTopicKey, setSelectedTopicKey] = useState<string | undefined>()

    // CRUD modal state for archetypes
    const [archetypeCreateOpen, setArchetypeCreateOpen] = useState(false)
    const [archetypeEdit, setArchetypeEdit] = useState<any | undefined>()
    const [archetypeOpLoading, setArchetypeOpLoading] = useState(false)
    // skeletons
    const [skeletonCreateOpen, setSkeletonCreateOpen] = useState(false)
    const [skeletonEdit, setSkeletonEdit] = useState<any | undefined>()
    const [skeletonOpLoading, setSkeletonOpLoading] = useState(false)
    // roles
    const [roleCreateOpen, setRoleCreateOpen] = useState(false)
    const [roleEdit, setRoleEdit] = useState<any | undefined>()
    const [roleOpLoading, setRoleOpLoading] = useState(false)
    // role pairs
    const [rolePairCreateOpen, setRolePairCreateOpen] = useState(false)
    const [rolePairEdit, setRolePairEdit] = useState<any | undefined>()
    const [rolePairOpLoading, setRolePairOpLoading] = useState(false)
    // rules
    const [ruleCreateOpen, setRuleCreateOpen] = useState(false)
    const [ruleEdit, setRuleEdit] = useState<any | undefined>()
    const [ruleOpLoading, setRuleOpLoading] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const res = await listWorlds()
            setItems(res)
            // default to 'home1', then 'home', otherwise first world key when available and none selected yet
            try {
                if (!selectedWorldKey) {
                    const keys = (res || []).map((w: any) => w && w.key).filter(Boolean)
                    if (keys.includes('home1')) {
                        setSelectedWorldKey('home1')
                    } else if (keys.includes('home')) {
                        setSelectedWorldKey('home')
                    } else if (keys.length > 0) {
                        setSelectedWorldKey(keys[0])
                    }
                }
            } catch (e) { /* noop */ }
        } catch (err: any) {
            console.error('[WorldList] load failed', err)
            setError(err?.message || String(err))
            notification.error({ message: '加载 worlds 失败', description: err?.message || String(err) })
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteWorld(key: string) {
        try {
            await deleteWorld(key)
            await load()
            notification.success({ message: '已删除' })
        } catch (err: any) {
            console.error('delete world failed', err)
            setError('Delete failed: ' + ((err && (err.message || JSON.stringify(err))) || String(err)))
            notification.error({ message: '删除失败', description: err?.message || String(err) })
        }
    }

    useEffect(() => {
        load()
        loadArchetypes()
        loadSkeletons()
        loadRoles()
        loadRolePairs()
        loadRules()
        loadRolePairRules()
        // load topics when worlds are initially loaded if a world is pre-selected
        if (selectedWorldKey) void loadTopicsForWorld(selectedWorldKey)
    }, [])

    async function loadArchetypes() {
        setArchetypesLoading(true)
        try {
            const res = await listConflictArchetypes()
            setArchetypes(res || [])
        } catch (e) {
            console.error('[WorldList] loadArchetypes failed', e)
        } finally { setArchetypesLoading(false) }
    }

    async function loadSkeletons() {
        setSkeletonsLoading(true)
        try {
            const res = await listConflictEscalationSkeletons()
            setSkeletons(res || [])
        } catch (e) {
            console.error('[WorldList] loadSkeletons failed', e)
        } finally { setSkeletonsLoading(false) }
    }

    async function loadRoles() {
        setRolesLoading(true)
        try {
            const res = await listRoles()
            setRoles(res || [])
        } catch (e) {
            console.error('[WorldList] loadRoles failed', e)
        } finally { setRolesLoading(false) }
    }

    async function loadRolePairs() {
        setRolePairsLoading(true)
        try {
            const res = await listRolePairs()
            setRolePairs(res || [])
        } catch (e) {
            console.error('[WorldList] loadRolePairs failed', e)
        } finally { setRolePairsLoading(false) }
    }

    async function loadRules() {
        setRulesLoading(true)
        try {
            const res = await listWorldArchetypeRules()
            setRules(res || [])
        } catch (e) {
            console.error('[WorldList] loadRules failed', e)
        } finally { setRulesLoading(false) }
    }

    async function loadRolePairRules() {
        setRolePairRulesLoading(true)
        try {
            const res = await listWorldRolePairRules()
            setRolePairRules(res || [])
        } catch (e) {
            console.error('[WorldList] loadRolePairRules failed', e)
        } finally { setRolePairRulesLoading(false) }
    }

    async function loadTopicsForWorld(worldKey?: string) {
        setTopicsLoading(true)
        try {
            if (!worldKey) { setTopics([]); setSelectedTopicKey(undefined); return }
            const res = await listTopicTemplates(worldKey)
            const list = res || []
            setTopics(list)
            // auto-select first topic.key when available so TopicActionsList will load immediately
            if (list.length > 0) {
                const firstKey = list[0].key ?? list[0].id
                // only override if none selected
                if (!selectedTopicKey) setSelectedTopicKey(firstKey)
            } else {
                setSelectedTopicKey(undefined)
            }
        } catch (e) {
            console.warn('[WorldList] loadTopicsForWorld failed', e)
            setTopics([])
            setSelectedTopicKey(undefined)
        } finally { setTopicsLoading(false) }
    }

    // reload topics when selected world changes
    useEffect(() => { void loadTopicsForWorld(selectedWorldKey); setSelectedTopicKey(undefined) }, [selectedWorldKey])

    function handleSaved(savedKey?: string) {
        setEditing(undefined)
        load()
        if (savedKey) setSelectedWorldKey(savedKey)
    }

    const columns = [
        { title: 'key', dataIndex: 'key', key: 'key' },
        { title: 'name', dataIndex: 'name', key: 'name' },
        { title: 'description', dataIndex: 'description', key: 'description' },
        {
            title: 'action',
            key: 'actions',
            render: (_: any, rec: World) => (
                <div>
                    <Button size="small" onClick={() => setEditing(rec)}>Edit</Button>
                    <Popconfirm title="Delete this world?" onConfirm={() => handleDeleteWorld(rec.key)}>
                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    // Archetype table columns with actions
    const archetypeColumns = [
        { title: 'Key', dataIndex: 'key', key: 'key' },
        { title: 'Category', dataIndex: 'category', key: 'category' },
        { title: 'Short Desc', dataIndex: 'short_desc', key: 'short_desc' },
        {
            title: '', key: 'actions', render: (_: any, r: any) => (
                <div>
                    <Button size="small" onClick={() => setArchetypeEdit(r)}>Edit</Button>
                    <Popconfirm title="Delete archetype?" onConfirm={async () => { try { setArchetypeOpLoading(true); await deleteConflictArchetype(r.key); await loadArchetypes(); notification.success({ message: '已删除 archetype' }); } catch (e) { console.error(e); notification.error({ message: '删除失败' }) } finally { setArchetypeOpLoading(false) } }}>
                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    const skeletonColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Archetype', dataIndex: 'archetype_key', key: 'archetype_key' },
        { title: 'Tone', dataIndex: 'tone', key: 'tone' },
        {
            title: '', key: 'actions', render: (_: any, r: any) => (
                <div>
                    <Button size="small" onClick={() => setSkeletonEdit(r)}>Edit</Button>
                    <Popconfirm title="Delete skeleton?" onConfirm={async () => { try { setSkeletonOpLoading(true); await deleteConflictEscalationSkeleton(r.id); await loadSkeletons(); notification.success({ message: '已删除 skeleton' }); } catch (e) { console.error(e); notification.error({ message: '删除失败' }) } finally { setSkeletonOpLoading(false) } }}>
                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    const roleColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Key', dataIndex: 'key', key: 'key' },
        { title: 'Display Name', dataIndex: 'display_name', key: 'display_name' },
        {
            title: '', key: 'actions', render: (_: any, r: any) => (
                <div>
                    <Button size="small" onClick={() => setRoleEdit(r)}>Edit</Button>
                    <Popconfirm title="Delete role?" onConfirm={async () => { try { setRoleOpLoading(true); await deleteRole(r.id); await loadRoles(); notification.success({ message: '已删除 role' }); } catch (e) { console.error(e); notification.error({ message: '删除失败' }) } finally { setRoleOpLoading(false) } }}>
                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    const rolePairColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Initiator', dataIndex: 'initiator_role', key: 'initiator_role' },
        { title: 'Responder', dataIndex: 'responder_role', key: 'responder_role' },
        {
            title: '', key: 'actions', render: (_: any, r: any) => (
                <div>
                    <Button size="small" onClick={() => setRolePairEdit(r)}>Edit</Button>
                    <Popconfirm title="Delete role pair?" onConfirm={async () => { try { setRolePairOpLoading(true); await deleteRolePair(r.id); await loadRolePairs(); notification.success({ message: '已删除 rolePair' }); } catch (e) { console.error(e); notification.error({ message: '删除失败' }) } finally { setRolePairOpLoading(false) } }}>
                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    const ruleColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'World', dataIndex: 'world_key', key: 'world_key' },
        { title: 'Archetype', dataIndex: 'archetype_key', key: 'archetype_key' },
        { title: 'Weight', dataIndex: 'weight', key: 'weight' },
        { title: 'Allowed', dataIndex: 'allowed', key: 'allowed', render: (v: any) => (v ? 'yes' : 'no') },
        { title: 'Notes', dataIndex: 'notes', key: 'notes' },
        {
            title: '', key: 'actions', render: (_: any, r: any) => (
                <div>
                    <Button size="small" onClick={() => setRuleEdit(r)}>Edit</Button>
                    <Popconfirm title="Delete rule?" onConfirm={async () => { try { setRuleOpLoading(true); await deleteWorldArchetypeRule(r.id); await loadRules(); notification.success({ message: '已删除 rule' }) } catch (e) { console.error(e); notification.error({ message: '删除失败' }) } finally { setRuleOpLoading(false) } }}>
                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    return (
        <div>
            {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
            <Modal title="Create World" open={creating} onCancel={() => setCreating(false)} footer={null} destroyOnClose>
                <WorldForm onSaved={() => { setCreating(false); load() }} />
            </Modal>

            <Modal title="Edit World" open={!!editing} onCancel={() => setEditing(undefined)} footer={null} destroyOnClose>
                {editing && <WorldForm world={editing} onSaved={handleSaved} />}
            </Modal>

            <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', gap: 8 }}>
                <Button type="primary" onClick={() => setCreating(true)}>Create World</Button>
                <Select placeholder="Select world" style={{ width: 220 }} value={selectedWorldKey} onChange={(v) => setSelectedWorldKey(v)}>
                    {items.map(w => (<Select.Option key={w.key} value={w.key}>{w.name}</Select.Option>))}
                </Select>
            </div>

            <Spin spinning={loading}>
                <StyledTable rowKey="key" dataSource={items} columns={columns} />
            </Spin>

            {/* Additional domain tables */}
            <div style={{ marginTop: 24 }}>
                {/* Topic Actions and Actions for the selected world (Topic Templates are managed on Scene Expansion page) */}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Select placeholder="Select topic" style={{ width: 360 }} value={selectedTopicKey} onChange={(v) => setSelectedTopicKey(v)} loading={topicsLoading}>
                        {topics.map(t => (
                            // prefer string topic.key (used by topic_actions route) and fall back to id
                            <Select.Option key={t.key ?? t.id} value={t.key ?? t.id}>{t.title ?? (t.key ?? String(t.id))}</Select.Option>
                        ))}
                    </Select>
                    <Button onClick={() => void loadTopicsForWorld(selectedWorldKey)}>Refresh Topics</Button>
                </div>

                <div style={{ marginTop: 12 }}>
                    <h4>Topic Actions</h4>
                    <TopicActionsList topicKey={selectedTopicKey} />
                </div>

                <div style={{ marginTop: 12 }}>
                    <h4>Actions</h4>
                    <ActionsList worldKey={selectedWorldKey} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Conflict Archetypes</h3>
                    <Button type="primary" onClick={() => setArchetypeCreateOpen(true)}>Create Archetype</Button>
                </div>
                <Spin spinning={archetypesLoading}>
                    <StyledTable dataSource={archetypes} rowKey={(r: any) => r.key} pagination={{ pageSize: 5 }} columns={archetypeColumns} />
                </Spin>

                <h3 style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Conflict Escalation Skeletons
                    <Button style={{ marginLeft: 12 }} type="primary" onClick={() => setSkeletonCreateOpen(true)}>Create Skeleton</Button>
                </h3>
                <Spin spinning={skeletonsLoading}>
                    <StyledTable dataSource={skeletons} rowKey={(r: any) => String(r.id)} pagination={{ pageSize: 5 }} columns={skeletonColumns} />
                </Spin>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Roles</h3>
                    <Button type="primary" onClick={() => setRoleCreateOpen(true)}>Create Role</Button>
                </div>
                <Spin spinning={rolesLoading}>
                    <StyledTable dataSource={roles} rowKey={(r: any) => String(r.id)} pagination={{ pageSize: 5 }} columns={roleColumns} />
                </Spin>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Role Pairs</h3>
                    <Button type="primary" onClick={() => setRolePairCreateOpen(true)}>Create Role Pair</Button>
                </div>
                <Spin spinning={rolePairsLoading}>
                    <StyledTable dataSource={rolePairs} rowKey={(r: any) => String(r.id)} pagination={{ pageSize: 5 }} columns={rolePairColumns} />
                </Spin>

                <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>World Archetype Rules</h3>
                        <Button type="primary" onClick={() => setRuleCreateOpen(true)}>Create Rule</Button>
                    </div>
                    <Spin spinning={rulesLoading}>
                        <StyledTable dataSource={rules} rowKey={(r: any) => String(r.id)} pagination={{ pageSize: 5 }} columns={ruleColumns} />
                    </Spin>
                </div>

                <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>World Role-Pair Rules</h3>
                        <Button type="primary" onClick={() => setRuleCreateOpen(true)}>Create Role-Pair Rule</Button>
                    </div>
                    <Spin spinning={rolePairRulesLoading}>
                        <StyledTable dataSource={rolePairRules} rowKey={(r: any) => String(r.id)} pagination={{ pageSize: 5 }} columns={[
                            { title: 'ID', dataIndex: 'id', key: 'id' },
                            { title: 'World', dataIndex: 'world_key', key: 'world_key' },
                            { title: 'Role Pair ID', dataIndex: 'role_pair_id', key: 'role_pair_id' },
                            { title: 'Weight', dataIndex: 'weight', key: 'weight' },
                            { title: 'Allowed', dataIndex: 'allowed', key: 'allowed', render: (v: any) => (v ? 'yes' : 'no') },
                            { title: 'Notes', dataIndex: 'notes', key: 'notes' },
                            {
                                title: '', key: 'actions', render: (_: any, r: any) => (
                                    <div>
                                        <Button size="small" onClick={() => setRuleEdit(r)}>Edit</Button>
                                        <Popconfirm title="Delete rule?" onConfirm={async () => { try { setRuleOpLoading(true); await deleteWorldRolePairRule(r.id); await loadRolePairRules(); notification.success({ message: '已删除 rule' }) } catch (e) { console.error(e); notification.error({ message: '删除失败' }) } finally { setRuleOpLoading(false) } }}>
                                            <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                                        </Popconfirm>
                                    </div>
                                )
                            }
                        ]} />
                    </Spin>
                </div>
            </div>

            {/* Modals for create/edit of the domain resources */}
            <Modal title="Create Archetype" open={archetypeCreateOpen} onCancel={() => setArchetypeCreateOpen(false)} footer={null} destroyOnClose>
                <ArchetypeForm onSaved={async () => { setArchetypeCreateOpen(false); await loadArchetypes(); }} />
            </Modal>
            <Modal title="Edit Archetype" open={!!archetypeEdit} onCancel={() => setArchetypeEdit(undefined)} footer={null} destroyOnClose>
                {archetypeEdit && <ArchetypeForm archetype={archetypeEdit} onSaved={async () => { setArchetypeEdit(undefined); await loadArchetypes(); }} />}
            </Modal>

            <Modal title="Create Skeleton" open={skeletonCreateOpen} onCancel={() => setSkeletonCreateOpen(false)} footer={null} destroyOnClose>
                <SkeletonForm onSaved={async () => { setSkeletonCreateOpen(false); await loadSkeletons(); }} />
            </Modal>
            <Modal title="Edit Skeleton" open={!!skeletonEdit} onCancel={() => setSkeletonEdit(undefined)} footer={null} destroyOnClose>
                {skeletonEdit && <SkeletonForm skeleton={skeletonEdit} onSaved={async () => { setSkeletonEdit(undefined); await loadSkeletons(); }} />}
            </Modal>

            <Modal title="Create Role" open={roleCreateOpen} onCancel={() => setRoleCreateOpen(false)} footer={null} destroyOnClose>
                <RoleForm onSaved={async () => { setRoleCreateOpen(false); await loadRoles(); }} />
            </Modal>
            <Modal title="Edit Role" open={!!roleEdit} onCancel={() => setRoleEdit(undefined)} footer={null} destroyOnClose>
                {roleEdit && <RoleForm role={roleEdit} onSaved={async () => { setRoleEdit(undefined); await loadRoles(); }} />}
            </Modal>

            <Modal title="Create Role Pair" open={rolePairCreateOpen} onCancel={() => setRolePairCreateOpen(false)} footer={null} destroyOnClose>
                <RolePairForm onSaved={async () => { setRolePairCreateOpen(false); await loadRolePairs(); }} />
            </Modal>
            <Modal title="Edit Role Pair" open={!!rolePairEdit} onCancel={() => setRolePairEdit(undefined)} footer={null} destroyOnClose>
                {rolePairEdit && <RolePairForm pair={rolePairEdit} onSaved={async () => { setRolePairEdit(undefined); await loadRolePairs(); }} />}
            </Modal>

            <Modal title="Create Rule" open={ruleCreateOpen} onCancel={() => setRuleCreateOpen(false)} footer={null} destroyOnClose>
                <RuleForm onSaved={async () => { setRuleCreateOpen(false); await loadRules(); }} worlds={items} archetypes={archetypes} />
            </Modal>
            <Modal title="Edit Rule" open={!!ruleEdit} onCancel={() => setRuleEdit(undefined)} footer={null} destroyOnClose>
                {ruleEdit && <RuleForm rule={ruleEdit} onSaved={async () => { setRuleEdit(undefined); await loadRules(); }} worlds={items} archetypes={archetypes} />}
            </Modal>

            <Modal title="Create Role-Pair Rule" open={ruleCreateOpen} onCancel={() => setRuleCreateOpen(false)} footer={null} destroyOnClose>
                <WorldRolePairRuleForm onSaved={async () => { setRuleCreateOpen(false); await loadRolePairRules(); }} worlds={items} />
            </Modal>
            <Modal title="Edit Role-Pair Rule" open={!!ruleEdit} onCancel={() => setRuleEdit(undefined)} footer={null} destroyOnClose>
                {ruleEdit && <WorldRolePairRuleForm rule={ruleEdit} onSaved={async () => { setRuleEdit(undefined); await loadRolePairRules(); }} worlds={items} />}
            </Modal>

        </div>
    )
}

function ArchetypeForm({ archetype, onSaved }: { archetype?: any, onSaved?: () => void }) {
    const [values, setValues] = useState<any>({ key: archetype?.key ?? '', category: archetype?.category ?? '', short_desc: archetype?.short_desc ?? '', default_tone: archetype?.default_tone ?? '' })

    async function submit() {
        try {
            if (archetype) {
                await updateConflictArchetype(archetype.key, { ...archetype, ...values })
                notification.success({ message: 'Archetype updated' })
            } else {
                await createConflictArchetype(values)
                notification.success({ message: 'Archetype created' })
            }
            onSaved?.()
        } catch (e: any) {
            console.error('archetype save failed', e)
            notification.error({ message: '保存失败', description: e?.message || String(e) })
        }
    }

    return (
        <div>
            <div style={{ display: 'grid', gap: 8 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>Key</div>
                    <Input value={values.key} onChange={(e) => setValues((prev: any) => ({ ...prev, key: e.target.value }))} disabled={!!archetype} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Category</div>
                    <Input value={values.category} onChange={(e) => setValues((prev: any) => ({ ...prev, category: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Short Desc</div>
                    <Input value={values.short_desc} onChange={(e) => setValues((prev: any) => ({ ...prev, short_desc: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Default Tone</div>
                    <Input value={values.default_tone} onChange={(e) => setValues((prev: any) => ({ ...prev, default_tone: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => onSaved && onSaved()}>Cancel</Button>
                    <Button type="primary" onClick={() => submit()}>Save</Button>
                </div>
            </div>
        </div>
    )
}

function SkeletonForm({ skeleton, onSaved }: { skeleton?: any, onSaved?: () => void }) {
    const [values, setValues] = useState<any>({ archetype_key: skeleton?.archetype_key ?? '', tone: skeleton?.tone ?? '', stages: skeleton?.stages ?? [] })
    // keep an editable text buffer for stages to avoid parsing on every keystroke/paste
    const [stagesText, setStagesText] = useState<string>(() => {
        try {
            return JSON.stringify(skeleton?.stages ?? [], null, 2)
        } catch (_) {
            return '[]'
        }
    })

    useEffect(() => {
        // update when opening a different skeleton for edit
        setValues({ archetype_key: skeleton?.archetype_key ?? '', tone: skeleton?.tone ?? '', stages: skeleton?.stages ?? [] })
        try {
            setStagesText(JSON.stringify(skeleton?.stages ?? [], null, 2))
        } catch (_) {
            setStagesText('[]')
        }
    }, [skeleton])

    async function submit() {
        try {
            // parse stagesText only on submit; show user-friendly error if invalid JSON
            let parsedStages: any = []
            try {
                parsedStages = stagesText && stagesText.trim() ? JSON.parse(stagesText) : []
            } catch (parseErr: any) {
                notification.error({ message: 'Invalid JSON', description: 'Stages must be valid JSON. Please fix the input before saving.' })
                return
            }

            const payload = { ...values, stages: parsedStages }

            if (skeleton) {
                await updateConflictEscalationSkeleton(skeleton.id, { ...skeleton, ...payload })
                notification.success({ message: 'Skeleton updated' })
            } else {
                await createConflictEscalationSkeleton(payload)
                notification.success({ message: 'Skeleton created' })
            }
            onSaved?.()
        } catch (e: any) {
            console.error('skeleton save failed', e)
            notification.error({ message: '保存失败', description: e?.message || String(e) })
        }
    }

    return (
        <div>
            <div style={{ display: 'grid', gap: 8 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>Archetype Key</div>
                    <Input value={values.archetype_key} onChange={(e) => setValues((p: any) => ({ ...p, archetype_key: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Tone</div>
                    <Input value={values.tone} onChange={(e) => setValues((p: any) => ({ ...p, tone: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Stages (JSON)</div>
                    <Input.TextArea rows={6} value={stagesText} onChange={(e) => { setStagesText(e.target.value) }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => onSaved && onSaved()}>Cancel</Button>
                    <Button type="primary" onClick={() => submit()}>Save</Button>
                </div>
            </div>
        </div>
    )
}

function RoleForm({ role, onSaved }: { role?: any, onSaved?: () => void }) {
    const [values, setValues] = useState<any>({ key: role?.key ?? '', display_name: role?.display_name ?? '', description: role?.description ?? '', age_group: role?.age_group ?? '' })

    async function submit() {
        try {
            if (role) {
                await updateRole(role.id, { ...role, ...values })
                notification.success({ message: 'Role updated' })
            } else {
                await createRole(values)
                notification.success({ message: 'Role created' })
            }
            onSaved?.()
        } catch (e: any) {
            console.error('role save failed', e)
            notification.error({ message: '保存失败', description: e?.message || String(e) })
        }
    }

    return (
        <div>
            <div style={{ display: 'grid', gap: 8 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>Key</div>
                    <Input value={values.key} onChange={(e) => setValues((p: any) => ({ ...p, key: e.target.value }))} disabled={!!role} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Display Name</div>
                    <Input value={values.display_name} onChange={(e) => setValues((p: any) => ({ ...p, display_name: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Description</div>
                    <Input.TextArea rows={4} value={values.description} onChange={(e) => setValues((p: any) => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Age Group</div>
                    <Input value={values.age_group} onChange={(e) => setValues((p: any) => ({ ...p, age_group: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => onSaved && onSaved()}>Cancel</Button>
                    <Button type="primary" onClick={() => submit()}>Save</Button>
                </div>
            </div>
        </div>
    )
}

function RolePairForm({ pair, onSaved }: { pair?: any, onSaved?: () => void }) {
    const [values, setValues] = useState<any>({ initiator_role: pair?.initiator_role ?? '', responder_role: pair?.responder_role ?? '', relation_type: pair?.relation_type ?? '' })

    async function submit() {
        try {
            if (pair) {
                await updateRolePair(pair.id, { ...pair, ...values })
                notification.success({ message: 'Role Pair updated' })
            } else {
                await createRolePair(values)
                notification.success({ message: 'Role Pair created' })
            }
            onSaved?.()
        } catch (e: any) {
            console.error('role pair save failed', e)
            notification.error({ message: '保存失败', description: e?.message || String(e) })
        }
    }

    return (
        <div>
            <div style={{ display: 'grid', gap: 8 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>Initiator Role</div>
                    <Input value={values.initiator_role} onChange={(e) => setValues((p: any) => ({ ...p, initiator_role: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Responder Role</div>
                    <Input value={values.responder_role} onChange={(e) => setValues((p: any) => ({ ...p, responder_role: e.target.value }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Relation Type</div>
                    <Input value={values.relation_type} onChange={(e) => setValues((p: any) => ({ ...p, relation_type: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => onSaved && onSaved()}>Cancel</Button>
                    <Button type="primary" onClick={() => submit()}>Save</Button>
                </div>
            </div>
        </div>
    )
}

function RuleForm({ rule, onSaved, worlds, archetypes }: { rule?: any, onSaved?: () => void, worlds: any[], archetypes: any[] }) {
    const [values, setValues] = useState<any>({ world_key: rule?.world_key ?? '', archetype_key: rule?.archetype_key ?? '', weight: rule?.weight ?? 1, allowed: rule?.allowed ?? true, notes: rule?.notes ?? '' })

    async function submit() {
        try {
            if (rule) {
                await updateWorldArchetypeRule(rule.id, { ...rule, ...values })
                notification.success({ message: 'Rule updated' })
            } else {
                await createWorldArchetypeRule(values)
                notification.success({ message: 'Rule created' })
            }
            onSaved?.()
        } catch (e: any) {
            console.error('rule save failed', e)
            notification.error({ message: '保存失败', description: e?.message || String(e) })
        }
    }

    return (
        <div>
            <div style={{ display: 'grid', gap: 8 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>World</div>
                    <Select style={{ width: '100%' }} value={values.world_key} onChange={(v) => setValues((p: any) => ({ ...p, world_key: v }))}>
                        {worlds.map(w => <Select.Option key={w.key} value={w.key}>{w.name}</Select.Option>)}
                    </Select>
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Archetype</div>
                    <Select style={{ width: '100%' }} value={values.archetype_key} onChange={(v) => setValues((p: any) => ({ ...p, archetype_key: v }))}>
                        {archetypes.map(a => <Select.Option key={a.key} value={a.key}>{a.key} {a.category ? `(${a.category})` : ''}</Select.Option>)}
                    </Select>
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Weight</div>
                    <Input type="number" value={values.weight} onChange={(e) => setValues((p: any) => ({ ...p, weight: Number((e.target as HTMLInputElement).value) }))} />
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Allowed</div>
                    <Select value={values.allowed ? 'yes' : 'no'} onChange={(v) => setValues((p: any) => ({ ...p, allowed: v === 'yes' }))}>
                        <Select.Option value="yes">Yes</Select.Option>
                        <Select.Option value="no">No</Select.Option>
                    </Select>
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>Notes</div>
                    <Input.TextArea rows={3} value={values.notes} onChange={(e) => setValues((p: any) => ({ ...p, notes: (e.target as HTMLTextAreaElement).value }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => onSaved && onSaved()}>Cancel</Button>
                    <Button type="primary" onClick={() => submit()}>Save</Button>
                </div>
            </div>
        </div>
    )
}
