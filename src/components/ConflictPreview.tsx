import React, { useEffect, useState } from 'react'
import { getConflict } from '../api/conflicts'
import type { Conflict } from '../types/conflict'
import styles from './ConflictPreview.module.css'

export default function ConflictPreview({ conflictKey }: { conflictKey?: string }): JSX.Element | null {
    const [conflict, setConflict] = useState<Conflict | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        let mounted = true
        setConflict(null)
        setError(null)
        if (!conflictKey) return
        setLoading(true)
        getConflict(String(conflictKey))
            .then(res => { if (!mounted) return; setConflict(res) })
            .catch(err => { if (!mounted) return; console.error('[ConflictPreview] getConflict failed', err); setError(err?.message || String(err)) })
            .finally(() => { if (!mounted) return; setLoading(false) })
        return () => { mounted = false }
    }, [conflictKey])

    if (!conflictKey) return null

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>Conflict Preview</div>
                <div className={styles.actions}>
                    <button className={styles.button} onClick={() => setExpanded(e => !e)}>{expanded ? 'Collapse' : 'Expand'}</button>
                    <button className={styles.button} onClick={() => { if (conflictKey) window.open(`/?conflictKey=${encodeURIComponent(conflictKey)}`, '_blank') }}>Open Details</button>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading conflict...</div>
            ) : error ? (
                <div className={styles.error}>Error loading conflict: {error}</div>
            ) : conflict ? (
                <div className={styles.content}>
                    <div><strong>Short desc:</strong> {conflict.short_desc ?? '-'} </div>
                    {expanded ? (
                        <div className={styles.expanded}>
                            <div><strong>Roles:</strong> {conflict.roles ? JSON.stringify(conflict.roles) : '-'}</div>
                            <div><strong>Escalation:</strong> {conflict.escalation ? JSON.stringify(conflict.escalation) : '-'}</div>
                        </div>
                    ) : (
                        <div className={styles.short}>{conflict.short_desc ? conflict.short_desc.slice(0, 180) : 'No description'}</div>
                    )}
                </div>
            ) : (
                <div className={styles.noPreview}>No preview available</div>
            )}
        </div>
    )
}
