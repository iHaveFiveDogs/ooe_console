import React, { useEffect, useState } from 'react'
import { Form, Select, InputNumber, Switch, Button, Popconfirm, Space, Alert, Spin, notification } from 'antd'
import StyledTable from '../components/StyledTable'
import { listLinksByScene, createLinkByKey, updatePriorityByKey, setActiveByKey, deleteByKey, type SceneConflictLink } from '../api/scene_conflict_links'
import { listScenes } from '../api/scenes'
import { listConflicts } from '../api/conflicts'
import { createSessionForScript } from '../api/engine'

export default function SceneConflictLinksPage({ initialSceneKey, initialConflictKey }: { initialSceneKey?: string, initialConflictKey?: string } = {}): JSX.Element {
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<SceneConflictLink[]>([])
    const [error, setError] = useState<string | null>(null)
    const [createError, setCreateError] = useState<string | null>(null)

    const [scenes, setScenes] = useState<any[]>([])
    const [conflicts, setConflicts] = useState<any[]>([])

    const [creating, setCreating] = useState(false)
    const [form] = Form.useForm()
    const [selectedSceneKey, setSelectedSceneKey] = useState<string | undefined>(undefined)

    async function load() {
        setLoading(true)
        try {
            const [scenesRes, conflictsRes] = await Promise.all([listScenes(), listConflicts()])
            setScenes(scenesRes)
            setConflicts(conflictsRes)
            setItems([])
        } catch (err: any) {
            console.error('load resources failed', err)
            setError(err?.message || String(err))
        } finally {
            setLoading(false)
        }
    }

    async function loadLinksForScene(sceneKey?: string) {
        setLoading(true)
        setError(null)
        try {
            if (!sceneKey) {
                setItems([])
                return
            }
            const res = await listLinksByScene(sceneKey)
            setItems(res || [])
        } catch (err: any) {
            console.error('load links for scene failed', err)
            const msg = err && ((err.body && (err.body.error || err.body.message)) || err.message) || String(err)
            setError(msg)
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    // when initialSceneKey/initialConflictKey provided, set them into form/state
    useEffect(() => {
        if (initialSceneKey) {
            setSelectedSceneKey(initialSceneKey)
            loadLinksForScene(initialSceneKey)
            form.setFieldsValue({ scene_key: initialSceneKey })
        }
        if (initialConflictKey) {
            form.setFieldsValue({ conflict_key: initialConflictKey })
        }
    }, [initialSceneKey, initialConflictKey])

    async function handleCreate(values: any) {
        setCreateError(null)
        const { scene_key, conflict_key, priority, is_active } = values
        if (!scene_key || !conflict_key) {
            setCreateError('scene and conflict are required')
            return
        }
        setCreating(true)
        try {
            await createLinkByKey({ scene_key, conflict_key, priority, is_active })
            form.resetFields(['conflict_key', 'priority', 'is_active'])
            setSelectedSceneKey(scene_key)
            await loadLinksForScene(scene_key)
        } catch (err: any) {
            console.error('create link failed', err)
            const msg = (err && ((err.body && (err.body.error || err.body.message)) || err.message)) || String(err)
            setCreateError(msg)
        } finally { setCreating(false) }
    }

    async function handleToggleActive(scene_key: string, conflict_key: string, active: boolean) {
        try {
            await setActiveByKey({ scene_key, conflict_key, is_active: active })
            await loadLinksForScene(scene_key)
        } catch (err: any) { console.error('toggle failed', err); setError('Update failed') }
    }

    async function handleUpdatePriority(scene_key: string, conflict_key: string, p: number) {
        try {
            await updatePriorityByKey({ scene_key, conflict_key, priority: p })
            await loadLinksForScene(scene_key)
        } catch (err: any) { console.error('update failed', err); setError('Update failed') }
    }

    async function handleDelete(scene_key: string, conflict_key: string) {
        try {
            await deleteByKey({ scene_key, conflict_key })
            await loadLinksForScene(scene_key)
        } catch (err: any) { console.error('delete failed', err); setError('Delete failed') }
    }

    async function handleStartScript(script_mongo_id?: string) {
        if (!script_mongo_id) {
            notification.error({ message: 'Cannot start: missing script_mongo_id' })
            return
        }
        try {
            const res = await createSessionForScript(String(script_mongo_id))
            // store initialSession in history state so ConversationPage can pick it up if user navigates there
            try { window.history.replaceState({ script_id: String(script_mongo_id), initialSession: res }, '') } catch (e) { }
            notification.success({ message: 'Session started', description: 'Session created successfully.' })
            console.log('[SceneConflictLinksPage] started session', { script_mongo_id, res })
        } catch (err: any) {
            console.error('[SceneConflictLinksPage] start failed', err)
            const msg = err && ((err.body && (err.body.error || err.body.message)) || err.message) || String(err)
            notification.error({ message: 'Failed to start session', description: msg })
        }
    }

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Scene',
            dataIndex: 'scene_key',
            key: 'scene_key',
            render: (val: string) => {
                const s = scenes.find((x: any) => x.key === val)
                return s ? `${s.title ?? s.name ?? ''} (${s.key})` : val
            }
        },
        { title: 'Conflict', dataIndex: 'conflict_key', key: 'conflict_key' },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (val: number, rec: SceneConflictLink) => (
                <InputNumber min={0} value={val} onChange={(v) => handleUpdatePriority((rec as any).scene_key, (rec as any).conflict_key, v ?? 0)} />
            )
        },
        {
            title: 'Active',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (val: boolean, rec: SceneConflictLink) => (
                <Switch checked={!!val} onChange={(checked) => handleToggleActive((rec as any).scene_key, (rec as any).conflict_key, checked)} />
            )
        },
        { title: 'Script Mongo ID', dataIndex: 'script_mongo_id', key: 'script_mongo_id' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, rec: SceneConflictLink) => (
                <Space>
                    {(rec as any).script_mongo_id ? <Button onClick={() => handleStartScript((rec as any).script_mongo_id)}>Start</Button> : null}
                    <Popconfirm title="Delete this link?" onConfirm={() => handleDelete((rec as any).scene_key, (rec as any).conflict_key)}>
                        <Button danger>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <div style={{ padding: 12 }}>
            <h2>Scene-Conflict Links</h2>
            {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}

            <Form form={form} layout="inline" onFinish={handleCreate} initialValues={{ priority: 0, is_active: true }} style={{ marginBottom: 12 }}>
                <Form.Item name="scene_key" label="Scene" rules={[{ required: true }]}>
                    <Select style={{ width: 300 }} showSearch placeholder="Select scene" onChange={(v) => { setSelectedSceneKey(v); loadLinksForScene(v); }} value={selectedSceneKey}>
                        {scenes.map(s => <Select.Option key={(s as any).key} value={(s as any).key}>{(s as any).title} ({(s as any).key})</Select.Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="conflict_key" label="Conflict" rules={[{ required: true }]}>
                    <Select style={{ width: 240 }} showSearch placeholder="Select conflict">
                        {conflicts.map(c => <Select.Option key={(c as any).key} value={(c as any).key}>{(c as any).key}</Select.Option>)}
                    </Select>
                </Form.Item>

                <Form.Item name="priority" label="Priority">
                    <InputNumber min={0} />
                </Form.Item>

                <Form.Item name="is_active" label="Active" valuePropName="checked">
                    <Switch />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={creating}>Create Link</Button>
                </Form.Item>

                {createError && <div style={{ color: 'red', marginLeft: 8 }}>{createError}</div>}
            </Form>

            <Spin spinning={loading}>
                <StyledTable rowKey={(rec: any) => `${rec.scene_key}::${rec.conflict_key}`} dataSource={items} columns={columns} />
            </Spin>
        </div>
    )
}
