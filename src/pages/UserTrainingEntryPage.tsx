import React, { useEffect, useState } from 'react'
import { get } from '../api/http'
import { /*createSession,*/ createSessionForScript } from '../api/engine'
import type { Scene } from '../types/scene'
import { Button, Spin, Alert, notification, Card, Tag, Collapse, Typography, Modal, Space } from 'antd'
const { Paragraph } = Typography
const { Panel } = Collapse

type ScriptPreview = {
    script_mongo_id?: string
    scene_key?: string
    conflict_key?: string
    intro_text?: string
    learner_role?: string
    learning_goal?: string
    steps_count?: number
    version?: string
}

export default function UserTrainingEntryPage({ navigateToConversationScript, navigateToConversation }: { navigateToConversationScript?: (script_id: string) => void | Promise<void>, navigateToConversation: (opts: { sceneKey: string, initialSession?: any }) => void }) {
    const [scripts, setScripts] = useState<ScriptPreview[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [practiceVisible, setPracticeVisible] = useState(false)
    const [practiceItem, setPracticeItem] = useState<ScriptPreview | null>(null)

    // NOTE: backend now guarantees script_mongo_id for startable scripts.
    // We only consume `script_mongo_id` and do NOT attempt to guess/normalize other id fields.

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const res = await get('/services/user/scripts')
                if (!mounted) return
                setScripts(res || [])
            } catch (err: any) {
                console.error('failed to load scripts', err)
                if (!mounted) return
                setError(err?.message || String(err))
                notification.error({ message: '加载脚本失败', description: err?.message || String(err) })
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    async function handleStartScript(script: ScriptPreview) {
        const scriptId = (script as any).script_mongo_id
        if (!scriptId) {
            console.error('[UserTrainingEntryPage] start requested but script has no script_mongo_id', script)
            notification.error({ message: 'Cannot start script', description: 'Missing script_mongo_id on this record.' })
            return
        }

        // Debug: log the resolved script_mongo_id and script before navigating
        console.log('[UserTrainingEntryPage] starting script', { script_mongo_id: scriptId, script })

        if (navigateToConversationScript) {
            // Pass the canonical script_mongo_id to the App navigation helper.
            void navigateToConversationScript(String(scriptId))
            return
        }

        // Without App navigation helper, attempt to create session directly using script_mongo_id
        try {
            const res = await createSessionForScript(String(scriptId))
            // navigateToConversation expects a sceneKey; pass empty sceneKey and the initialSession
            navigateToConversation({ sceneKey: '', initialSession: res })
            return
        } catch (err: any) {
            console.error('[UserTrainingEntryPage] createSessionForScript failed', err)
            notification.error({ message: 'Failed to start session', description: ((err && (err.message || JSON.stringify(err))) || String(err)) })
            return
        }
    }

    function openPractice(script: ScriptPreview) {
        setPracticeItem(script)
        setPracticeVisible(true)
    }

    return (
        <div style={{ padding: 12 }}>
            <h2>User Training Scripts</h2>

            <Spin spinning={loading}>
                {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
                {!loading && scripts.length === 0 && <div>No scripts available</div>}
                {!loading && scripts.length > 0 && (
                    <div className="scene-grid">
                        {scripts.map((s, idx) => {
                            const mongoId = (s as any).script_mongo_id as string | undefined
                            const key = mongoId ?? `script-${idx}`
                            return (
                                <Card key={key} size="small" bodyStyle={{ padding: 12 }} style={{ borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ maxWidth: '70%' }}>
                                            <div style={{ fontWeight: 700 }}>{s.intro_text ?? 'Training'}</div>
                                            <Paragraph style={{ margin: 6 }} ellipsis={{ rows: 2 }}>{s.learning_goal ?? ''}</Paragraph>
                                            <div style={{ color: '#555' }}>Role: {s.learner_role ?? '-'}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                            <Tag color="blue">Child</Tag>
                                            <Tag color="green">Parent</Tag>
                                            <Tag color="volcano">knife</Tag>
                                        </div>
                                    </div>

                                    <Collapse size="small" style={{ marginTop: 8 }}>
                                        <Panel header="Example / Prompt" key="1">
                                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{`Learner: Child: Can I help you cook today?\nLearner: Parent: I'd love your help, but the knife can be dangerous.`}</pre>
                                        </Panel>
                                    </Collapse>

                                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Space>
                                            <Button onClick={() => openPractice(s)}>Practice</Button>
                                            {(s as any).script_mongo_id ? (
                                                <Button type="primary" onClick={() => handleStartScript(s)}>Start</Button>
                                            ) : (
                                                <Button disabled>Start (missing script_mongo_id)</Button>
                                            )}
                                        </Space>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}

                <Modal title="Practice" open={practiceVisible} onCancel={() => setPracticeVisible(false)} footer={null} destroyOnClose>
                    {practiceItem && (
                        <div>
                            <h4>Scene: HomeWorld — Cooking in the Kitchen</h4>
                            <Paragraph><strong>Prompt:</strong> A clean home kitchen in the morning. A counter with a knife, vegetables, and cooking tools. Conflict: Negotiating participation under safety constraints.</Paragraph>
                            <Paragraph><strong>Task (Step 1):</strong> As the Child, ask to help and mention the knife and safety.</Paragraph>
                            <Paragraph code>Child: Can I help you cook today? I will be careful with the knife.</Paragraph>
                            <div style={{ textAlign: 'right' }}>
                                <Button type="primary" onClick={() => setPracticeVisible(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </Spin>
        </div>
    )
}
