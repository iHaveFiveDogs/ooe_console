//src/pages/SceneList.tsx
import React, { useEffect, useState } from 'react'
import type { SceneSummary } from '../types/sceneSummary'
import { listScenesByWorld, deleteScene } from '../api/scenes'
import { getWorld } from '../api/worlds'
import SceneForm from './SceneForm'
import { Modal, Button, Popconfirm, Spin, Alert, notification, Space, List } from 'antd'
import WorldSelector from './WorldSelector'
import { useNavigate } from 'react-router-dom'

interface Props {
    worldKey?: string
    // Unified handler: parent should accept script_mongo_id and handle session creation/navigation.
    // Returning a Promise is allowed for async handlers.
    onStart?: (scriptMongoId: string) => void | Promise<void>
}

export default function SceneList({ worldKey, onStart }: Props): JSX.Element {
    const navigate = useNavigate()
    const [localWorldKey, setLocalWorldKey] = useState<string | undefined>(undefined)
    const effectiveWorldKey = worldKey ?? localWorldKey
    const [items, setItems] = useState<SceneSummary[]>([])
    const [editing, setEditing] = useState<string | undefined>(undefined)
    const [creating, setCreating] = useState(false)
    const [worldTitle, setWorldTitle] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        if (!effectiveWorldKey) {
            setItems([])
            setWorldTitle(null)
            return () => { mounted = false }
        }

        // Fetch world title in parallel with scenes
        getWorld(effectiveWorldKey)
            .then(w => { if (!mounted) return; setWorldTitle(w.name ?? null) })
            .catch(() => { if (!mounted) return; setWorldTitle(null) })

        setLoading(true)
        listScenesByWorld(effectiveWorldKey)
            .then(res => { if (!mounted) return; setItems(res) })
            .catch((err: any) => {
                if (!mounted) return
                setItems([])
                console.error('[SceneList] failed to load scenes', err)
                setError(err?.message || String(err))
                notification.error({ message: 'Failed to load scenes', description: err?.message || String(err) })
            })
            .finally(() => { if (mounted) setLoading(false) })

        return () => { mounted = false }
    }, [effectiveWorldKey])

    console.log('SceneList worldKey =', worldKey)

    async function handleDeleteScene(key: string) {
        try {
            await deleteScene(key)
            if (worldKey) {
                const res = await listScenesByWorld(worldKey)
                setItems(res)
            } else {
                setItems([])
            }
            notification.success({ message: '已删除' })
        } catch (err: any) {
            console.error('delete scene failed', err)
            const msg = 'Delete failed: ' + ((err && (err.message || JSON.stringify(err))) || String(err))
            setError(msg)
            notification.error({ message: '删除失败', description: msg })
        }
    }

    function handleStart(scene: SceneSummary) {
        const scriptId = (scene as any).script_mongo_id as string | undefined
        if (!scriptId) {
            notification.error({ message: 'Cannot start', description: 'Missing script_mongo_id on this scene.' })
            return
        }

        if (typeof onStart === 'function') {
            // Call unified handler and allow it to be async
            try {
                void (onStart as (id: string) => void | Promise<void>)(String(scriptId))
            } catch (err) {
                console.error('[SceneList] onStart threw', err)
                notification.error({ message: 'Start failed', description: (err as any)?.message || String(err) })
            }
        } else {
            console.warn('[SceneList] onStart handler not provided')
            notification.error({ message: 'Start handler not available', description: 'App did not provide a start handler.' })
        }
    }

    return (
        <div className="module-wrapper">
            <div className="select-row" style={{ width: '100%', marginBottom: 12 }}>
                <WorldSelector value={effectiveWorldKey} onChange={(k) => setLocalWorldKey(k)} />
                <Button onClick={() => navigate('/scene/world')}>Create / Manage Worlds</Button>
            </div>
            {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
            {/* Create mode: show SceneForm in Modal */}
            <Modal title="Create Scene" open={creating} onCancel={() => setCreating(false)} footer={null} destroyOnClose>
                <SceneForm
                    onSaved={() => {
                        setCreating(false)
                        if (worldKey) {
                            listScenesByWorld(worldKey).then(setItems).catch(() => { })
                        } else {
                            setItems([])
                        }
                    }}
                />
            </Modal>

            {/* Edit mode: show SceneForm in Modal */}
            <Modal title="Edit Scene" open={editing !== undefined} onCancel={() => setEditing(undefined)} footer={null} destroyOnClose>
                {editing !== undefined && (
                    <SceneForm
                        scene={{ key: editing } as any}
                        onSaved={() => {
                            setEditing(undefined)
                            if (worldKey) {
                                listScenesByWorld(worldKey).then(setItems).catch(() => { })
                            } else {
                                setItems([])
                            }
                        }}
                    />
                )}
            </Modal>

            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                {worldKey === undefined ? (
                    <strong>Please select a world</strong>
                ) : (
                    <div>
                        <div><strong>World:</strong> {worldTitle ?? worldKey}</div>
                        <div><strong>Scenes:</strong> {items.length}</div>
                    </div>
                )}
                <div>
                    <Button type="primary" onClick={() => setCreating(true)}>Create Scene</Button>
                </div>
            </div>

            <Spin spinning={loading}>
                {/* List view with pagination: 5 records per page */}
                <List
                    itemLayout="vertical"
                    dataSource={items}
                    pagination={{ pageSize: 5 }}
                    renderItem={(scene) => (
                        <List.Item
                            key={scene.key}
                            actions={[
                                <div key={`actions-${scene.key}`}>
                                    <Button size="small" onClick={() => setEditing(scene.key)}>Edit</Button>
                                    <Popconfirm key={`pop-${scene.key}`} title="Delete this scene?" onConfirm={() => handleDeleteScene(scene.key)}>
                                        <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                                    </Popconfirm>
                                </div>,
                                (scene as any).script_mongo_id ? (
                                    <Button key={`start-${scene.key}`} type="primary" size="small" onClick={() => handleStart(scene)}>Start</Button>
                                ) : (
                                    <Button key={`start-disabled-${scene.key}`} size="small" disabled>Start (missing script_mongo_id)</Button>
                                )
                            ]}
                        >
                            <List.Item.Meta
                                title={<h3 style={{ margin: 0 }}>{scene.title}</h3>}
                                description={<p style={{ marginTop: 8, color: '#444' }}>{scene.short_description ?? ''}</p>}
                            />
                        </List.Item>
                    )}
                />
            </Spin>

            {/* Scene-Conflict Links panel removed from this page */}
        </div>
    )
}
