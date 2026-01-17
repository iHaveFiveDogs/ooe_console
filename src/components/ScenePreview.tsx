import React, { useEffect, useState } from 'react'
import { getScene } from '../api/scenes'
import type { Scene } from '../types/scene'

export default function ScenePreview({ sceneKey }: { sceneKey?: string }): JSX.Element | null {
    const [scene, setScene] = useState<Scene | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        let mounted = true
        setScene(null)
        setError(null)
        if (!sceneKey) return
        setLoading(true)
        getScene(String(sceneKey))
            .then(res => { if (!mounted) return; setScene(res) })
            .catch(err => { if (!mounted) return; console.error('[ScenePreview] getScene failed', err); setError(err?.message || String(err)) })
            .finally(() => { if (!mounted) return; setLoading(false) })
        return () => { mounted = false }
    }, [sceneKey])

    if (!sceneKey) return null

    return (
        <div style={{ border: '1px solid #e5e7eb', padding: 10, borderRadius: 6, background: '#fff', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>Scene Preview</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setExpanded(e => !e)}>{expanded ? 'Collapse' : 'Expand'}</button>
                    <button onClick={() => { if (sceneKey) window.open(`/?sceneKey=${encodeURIComponent(sceneKey)}`, '_blank') }}>Open Details</button>
                </div>
            </div>

            {loading ? (
                <div style={{ marginTop: 8 }}>Loading scene...</div>
            ) : error ? (
                <div style={{ marginTop: 8, color: 'red' }}>Error loading scene: {error}</div>
            ) : scene ? (
                <div style={{ marginTop: 8 }}>
                    <div><strong>Title:</strong> {scene.title ?? '-'} </div>
                    {expanded ? (
                        <div style={{ marginTop: 8 }}>
                            <div><strong>Short description:</strong> {scene.short_description ?? '-'}</div>
                            <div><strong>Difficulty:</strong> {String(scene.difficulty ?? '-')}</div>
                            <div><strong>World id:</strong> {String((scene as any).world_id ?? '-')}</div>
                        </div>
                    ) : (
                        <div style={{ marginTop: 8, color: '#555' }}>{scene.short_description ? scene.short_description.slice(0, 180) : 'No description'}</div>
                    )}
                </div>
            ) : (
                <div style={{ marginTop: 8, color: '#666' }}>No preview available</div>
            )}
        </div>
    )
}
