import React, { useEffect, useState } from 'react'
import { listActions, createAction, updateAction, deleteAction } from '../api/actions'
import StyledTable from '../components/StyledTable'
import { Button, Modal, Input, Form, notification, Popconfirm, Spin, Alert } from 'antd'

export default function ActionsList({ worldKey }: { worldKey?: string }): JSX.Element {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState<any | undefined>(undefined)
    const [createOpen, setCreateOpen] = useState(false)

    async function load() {
        setError(null)
        setLoading(true)
        try {
            const res = await listActions(worldKey)
            setItems(res || [])
        } catch (e: any) {
            console.error('[ActionsList] load failed', e)
            setError(e && (e.body && (e.body.details || e.body.error)) ? (e.body.details || JSON.stringify(e.body)) : (e.message || String(e)))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { void load() }, [worldKey])

    async function handleCreate(values: any) {
        try {
            await createAction(values)
            notification.success({ message: 'Action created' })
            setCreateOpen(false)
            await load()
        } catch (e: any) {
            console.error('create action failed', e)
            notification.error({ message: 'Create failed', description: e?.message || String(e) })
        }
    }

    async function handleUpdate(values: any) {
        try {
            if (!editing) return
            await updateAction(editing.action_key ?? editing.key, values)
            notification.success({ message: 'Action updated' })
            setEditing(undefined)
            await load()
        } catch (e: any) {
            console.error('update action failed', e)
            notification.error({ message: 'Update failed', description: e?.message || String(e) })
        }
    }

    async function handleDelete(key: string) {
        try {
            await deleteAction(key)
            notification.success({ message: 'Deleted' })
            await load()
        } catch (e: any) {
            console.error('delete failed', e)
            notification.error({ message: 'Delete failed', description: e?.message || String(e) })
        }
    }

    const columns = [
        { title: 'Key', dataIndex: 'action_key', key: 'action_key', render: (_: any, r: any) => (r.action_key ?? r.key ?? r.id) },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Description', dataIndex: 'description', key: 'description', render: (v: any) => v ?? '-' },
        { title: 'World', dataIndex: 'world_key', key: 'world_key' },
        {
            title: 'Action', key: 'action', render: (_: any, r: any) => (
                <div>
                    <Button size="small" onClick={() => setEditing(r)}>Edit</Button>
                    <Popconfirm title="Delete this?" onConfirm={() => handleDelete(r.action_key ?? r.key ?? r.id)}>
                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    return (
        <div>
            {error && <Alert type="error" message={error} style={{ marginBottom: 8 }} />}
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button type="primary" onClick={() => setCreateOpen(true)}>Create Action</Button>
                <Button onClick={() => void load()}>Refresh</Button>
            </div>

            <Spin spinning={loading}>
                <StyledTable rowKey={(r: any, idx?: number) => r.action_key ?? r.key ?? String(r.id ?? idx ?? 0)} dataSource={items} columns={columns} />
            </Spin>

            <Modal title="Create Action" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} destroyOnClose>
                <Form layout="vertical" onFinish={handleCreate} initialValues={{}}>
                    <Form.Item name="action_key" label="Action Key" rules={[{ required: true }]}> <Input /></Form.Item>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}> <Input /></Form.Item>
                    <Form.Item name="world_key" label="World Key" rules={[{ required: true }]}> <Input /></Form.Item>
                    <Form.Item name="description" label="Description"> <Input.TextArea rows={4} /></Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button htmlType="submit" type="primary">Create</Button>
                    </div>
                </Form>
            </Modal>

            <Modal title="Edit Action" open={!!editing} onCancel={() => setEditing(undefined)} footer={null} destroyOnClose>
                {editing && (
                    <Form layout="vertical" onFinish={handleUpdate} initialValues={editing}>
                        <Form.Item name="name" label="Name" rules={[{ required: true }]}> <Input /></Form.Item>
                        <Form.Item name="description" label="Description"> <Input.TextArea rows={4} /></Form.Item>
                        <Form.Item name="world_key" label="World Key" rules={[{ required: true }]}> <Input /></Form.Item>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={() => setEditing(undefined)}>Cancel</Button>
                            <Button htmlType="submit" type="primary">Save</Button>
                        </div>
                    </Form>
                )}
            </Modal>
        </div>
    )
}
