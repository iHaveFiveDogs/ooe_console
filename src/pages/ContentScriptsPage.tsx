import React, { useEffect, useState } from 'react'
import { listContentScriptSummaries, listContentScriptAssets, createContentScript, updateContentScript, deleteContentScript } from '../api/contentScripts'
import { Button, Modal, Form, Input, InputNumber, notification, Space, Popconfirm, Card } from 'antd'
import StyledTable from '../components/StyledTable'
import ScriptAssetDetails from '../components/ScriptAssetDetails'

export default function ContentScriptsPage(): JSX.Element {
    const [summaries, setSummaries] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    // cache assets by script_key to avoid re-fetching
    const [scriptAssetsCache, setScriptAssetsCache] = useState<Record<string, any[]>>({})
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
    const [editing, setEditing] = useState<any | null>(null)
    const [open, setOpen] = useState(false)
    const [form] = Form.useForm()

    async function reload() {
        setLoading(true)
        try {
            const res = await listContentScriptSummaries()
            console.log('[ContentScriptsPage] listContentScriptSummaries response =', res)
            // Normalize response shapes: backend may return array or object { items: [], scripts: [], data: [] }
            let normalized: any[] = []
            if (!res) normalized = []
            else if (Array.isArray(res)) normalized = res
            else if (res.items && Array.isArray(res.items)) normalized = res.items
            else if (res.scripts && Array.isArray(res.scripts)) normalized = res.scripts
            else if (res.data && Array.isArray(res.data)) normalized = res.data
            else normalized = Array.isArray(res) ? res : []
            setSummaries(normalized)
        } catch (err: any) {
            notification.error({ message: 'Failed to load script summaries', description: err?.message || String(err) })
        } finally { setLoading(false) }
    }

    useEffect(() => { reload() }, [])

    function openCreate() {
        setEditing(null)
        form.resetFields()
        setOpen(true)
    }

    function openEdit(record: any) {
        setEditing(record)
        form.setFieldsValue(record)
        setOpen(true)
    }

    async function handleDelete(id: string) {
        try {
            await deleteContentScript(id)
            notification.success({ message: 'Deleted' })
            reload()
        } catch (err: any) {
            notification.error({ message: 'Delete failed', description: err?.message || String(err) })
        }
    }

    async function handleOk() {
        try {
            const vals = await form.validateFields()
            if (editing) {
                await updateContentScript(editing.script_mongo_id || editing._id || editing.id, vals)
                notification.success({ message: 'Updated' })
            } else {
                await createContentScript(vals)
                notification.success({ message: 'Created' })
            }
            setOpen(false)
            reload()
        } catch (err: any) {
            notification.error({ message: 'Save failed', description: err?.message || String(err) })
        }
    }

    const columns = [
        { title: 'ID', dataIndex: 'script_mongo_id', key: 'id', render: (v: any) => v || '-' },
        { title: 'Script Key', dataIndex: 'script_key', key: 'key' },
        { title: 'Scene Key', dataIndex: 'scene_key', key: 'scene' },
        { title: 'Version', dataIndex: 'version', key: 'version' },
        {
            title: 'Details', key: 'details', render: (_: any, r: any) => (
                <Button size="small" onClick={async () => {
                    const key = getRowKey(r)
                    const isExpanded = expandedRowKeys.includes(key)
                    if (isExpanded) {
                        setExpandedRowKeys(prev => prev.filter(k => k !== key))
                        return
                    }
                    // expand: fetch assets if needed then expand
                    try {
                        await fetchAssetsForScriptKey(r.script_key)
                        setExpandedRowKeys(prev => [...prev, key])
                    } catch (err: any) {
                        notification.error({ message: 'Failed to load script assets', description: err?.message || String(err) })
                    }
                }}>Details</Button>
            )
        },
        {
            title: 'Actions', key: 'actions', render: (_: any, r: any) => (
                <Space>
                    <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
                    <Popconfirm title="Delete script?" onConfirm={() => handleDelete(r.script_mongo_id || r._id || r.id)}>
                        <Button size="small" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <div>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <h2>Scripts (Content)</h2>
                <div>
                    <Button onClick={openCreate}>New Script</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => reload()}>Reload</Button>
                </div>
            </div>

            <StyledTable
                dataSource={summaries}
                loading={loading}
                columns={columns}
                rowKey={(r: any) => getRowKey(r)}
                expandable={{
                    expandedRowRender: (record: any) => {
                        const assets = scriptAssetsCache[record.script_key] || []
                        if (!assets || assets.length === 0) {
                            return <Card size="small">No assets loaded for this script. Expand to fetch details.</Card>
                        }
                        return (
                            <div style={{ padding: 12 }}>
                                {assets.map((a: any) => (
                                    <ScriptAssetDetails key={a._id || a.id} asset={a} />
                                ))}
                            </div>
                        )
                    },
                    // when user clicks the expand arrow
                    onExpand: async (expanded: boolean, record: any) => {
                        const key = getRowKey(record)
                        if (expanded) {
                            try {
                                await fetchAssetsForScriptKey(record.script_key)
                            } catch (err: any) {
                                notification.error({ message: 'Failed to load script assets', description: err?.message || String(err) })
                            }
                            setExpandedRowKeys(prev => Array.from(new Set([...prev, key])))
                        } else {
                            setExpandedRowKeys(prev => prev.filter(k => k !== key))
                        }
                    }
                }}
                expandedRowKeys={expandedRowKeys}
            />

            <Modal title={editing ? 'Edit Script' : 'Create Script'} open={open} onCancel={() => setOpen(false)} onOk={handleOk}>
                <Form form={form} layout="vertical">
                    <Form.Item name="script_key" label="Script Key" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="scene_key" label="Scene Key" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="conflict_key" label="Conflict Key">
                        <Input />
                    </Form.Item>
                    <Form.Item name="version" label="Version">
                        <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item name="intro_text" label="Intro Text">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="model" label="Model">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )

    function getRowKey(record: any) {
        return String(record.script_mongo_id || record._id || record.id || record.script_key || '')
    }

    async function fetchAssetsForScriptKey(script_key: string) {
        if (!script_key) return
        if (scriptAssetsCache[script_key] && scriptAssetsCache[script_key].length > 0) return
        setLoading(true)
        try {
            // try server-side filter via query param if supported
            const res = await listContentScriptAssets({ script_key })
            console.log('[ContentScriptsPage] listContentScriptAssets response =', res)
            let assets: any[] = []
            if (!res) assets = []
            else if (Array.isArray(res)) assets = res
            else if (res.items && Array.isArray(res.items)) assets = res.items
            else if (res.data && Array.isArray(res.data)) assets = res.data
            else assets = Array.isArray(res) ? res : []
            const filtered = assets.filter(a => a.script_key === script_key)
            setScriptAssetsCache(prev => ({ ...prev, [script_key]: filtered }))
        } finally { setLoading(false) }
    }
}
