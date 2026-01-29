import React, { useEffect, useState } from 'react'
import { listTopicActionsForTopic, createTopicAction, updateTopicAction, deleteTopicAction } from '../api/topicActions'
import StyledTable from '../components/StyledTable'
import { Button, Modal, Input, Form, notification, Popconfirm, Spin, Alert } from 'antd'

export default function TopicActionsList({ topicKey }: { topicKey?: string }): JSX.Element {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState<any | undefined>(undefined)
    const [createOpen, setCreateOpen] = useState(false)

    async function load() {
        setError(null)
        setLoading(true)
        try {
            if (!topicKey) return setItems([])
            const res = await listTopicActionsForTopic(topicKey)
            setItems(res || [])
        } catch (e: any) {
            console.error('[TopicActionsList] load failed', e)
            setError(e && (e.body && (e.body.details || e.body.error)) ? (e.body.details || JSON.stringify(e.body)) : (e.message || String(e)))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { void load() }, [topicKey])

    async function handleCreate(values: any) {
        try {
            await createTopicAction({ topic_key: topicKey, ...values })
            notification.success({ message: 'Topic action created' })
            setCreateOpen(false)
            await load()
        } catch (e: any) {
            console.error('create topic action failed', e)
            notification.error({ message: 'Create failed', description: e?.message || String(e) })
        }
    }

    async function handleUpdate(values: any) {
        try {
            if (!editing) return
            await updateTopicAction(editing.id, values)
            notification.success({ message: 'Topic action updated' })
            setEditing(undefined)
            await load()
        } catch (e: any) {
            console.error('update topic action failed', e)
            notification.error({ message: 'Update failed', description: e?.message || String(e) })
        }
    }

    async function handleDelete(id: number) {
        try {
            await deleteTopicAction(id)
            notification.success({ message: 'Deleted' })
            await load()
        } catch (e: any) {
            console.error('delete failed', e)
            notification.error({ message: 'Delete failed', description: e?.message || String(e) })
        }
    }

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Topic Key', dataIndex: 'topic_key', key: 'topic_key', render: (v: any, r: any) => v ?? r.topic ?? '-' },
        { title: 'Action Key', dataIndex: 'action_key', key: 'action_key', render: (v: any) => v ?? '-' },
        { title: 'Order', dataIndex: 'suggested_order', key: 'suggested_order', render: (v: any) => (v != null ? String(v) : '-') },
        { title: 'Metadata', dataIndex: 'metadata', key: 'metadata', render: (v: any) => (v ? JSON.stringify(v) : '-') },
        {
            title: 'Action', key: 'action', render: (_: any, r: any) => (
                <div>
                    <Button size="small" onClick={() => setEditing(r)}>Edit</Button>
                    <Popconfirm title="Delete this?" onConfirm={() => handleDelete(r.id)}>
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
                <Button type="primary" onClick={() => setCreateOpen(true)} disabled={!topicKey}>Create Topic Action</Button>
                <Button onClick={() => void load()}>Refresh</Button>
            </div>

            <Spin spinning={loading}>
                <StyledTable rowKey={(r: any) => String(r.id)} dataSource={items} columns={columns} />
            </Spin>

            <Modal title="Create Topic Action" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} destroyOnClose>
                <Form layout="vertical" onFinish={handleCreate} initialValues={{}}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}> <Input /></Form.Item>
                    <Form.Item name="action_type" label="Action Type" rules={[{ required: true }]}> <Input /></Form.Item>
                    <Form.Item name="payload" label="Payload (JSON)"> <Input.TextArea rows={4} /></Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button htmlType="submit" type="primary">Create</Button>
                    </div>
                </Form>
            </Modal>

            <Modal title="Edit Topic Action" open={!!editing} onCancel={() => setEditing(undefined)} footer={null} destroyOnClose>
                {editing && (
                    <Form layout="vertical" onFinish={handleUpdate} initialValues={editing}>
                        <Form.Item name="name" label="Name" rules={[{ required: true }]}> <Input /></Form.Item>
                        <Form.Item name="action_type" label="Action Type" rules={[{ required: true }]}> <Input /></Form.Item>
                        <Form.Item name="payload" label="Payload (JSON)"> <Input.TextArea rows={4} /></Form.Item>
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
