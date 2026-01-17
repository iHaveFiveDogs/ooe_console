import React, { useEffect, useState } from 'react'
import { Button, Card, Spin, notification } from 'antd'
import { createSessionForScript } from '../api/engine'
import { get } from '../api/http'
import { useNavigate } from 'react-router-dom'

type ScriptPreview = {
    script_mongo_id?: string
    intro_text?: string
    learner_role?: string
    learning_goal?: string
}

export default function ChatPage(): JSX.Element {
    const [scripts, setScripts] = useState<ScriptPreview[]>([])
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState<string | null>(null)
    const navigate = useNavigate()

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
                notification.error({ message: 'Failed to load scripts', description: err?.message || String(err) })
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    async function handleStartScript(scriptId?: string) {
        if (!scriptId) {
            notification.error({ message: 'Cannot start', description: 'Missing script_mongo_id' })
            return
        }
        setStarting(scriptId)
        try {
            const session = await createSessionForScript(String(scriptId))
            navigate('/conversation', { state: { script_id: String(scriptId), initialSession: session } })
        } catch (err: any) {
            console.error('start session failed', err)
            notification.error({ message: 'Failed to start session', description: err?.message || String(err) })
        } finally {
            setStarting(null)
        }
    }

    return (
        <div style={{ padding: 12 }}>
            <h2>Chat</h2>
            <p>Select a script below to start a session.</p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : scripts.length === 0 ? (
                <div>No scripts available</div>
            ) : (
                <div className="scene-grid">
                    {scripts.map((s, idx) => {
                        const id = (s as any).script_mongo_id ?? `script-${idx}`
                        return (
                            <Card key={id} size="small" bodyStyle={{ padding: 12 }} style={{ borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ maxWidth: '70%' }}>
                                        <div style={{ fontWeight: 700 }}>{s.intro_text ?? 'Script'}</div>
                                        <div style={{ marginTop: 6, color: '#555' }}>{s.learning_goal ?? ''}</div>
                                        <div style={{ marginTop: 6, color: '#777' }}>Role: {s.learner_role ?? '-'}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                                        <Button type="primary" onClick={() => handleStartScript((s as any).script_mongo_id)} loading={starting === (s as any).script_mongo_id}>Start</Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
