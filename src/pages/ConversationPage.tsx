import React, { useEffect, useState } from 'react'
import PracticeChatContent from '../components/PracticeChatContent'
import { useLocation } from 'react-router-dom'
import { listScripts } from '../api/engine'

type LocationState = { script_id?: string; initialSession?: any }

export default function ConversationPage(): JSX.Element {
    const location = useLocation()
    const state = (location.state || {}) as LocationState
    const scriptId = state.script_id

    const [script, setScript] = useState<any | null>(null)
    const [loading, setLoading] = useState<boolean>(!!scriptId)

    useEffect(() => {
        let mounted = true
        if (!scriptId) {
            setLoading(false)
            return
        }
        setLoading(true)
        listScripts(String(scriptId))
            .then((res: any) => {
                if (!mounted) return
                // API returns an array of script summaries. Find the one that matches the requested script_mongo_id.
                let s: any = null
                if (Array.isArray(res)) {
                    s = res.find((item: any) => {
                        const id = (item && (item.script_mongo_id || item._id || item.id)) && String(item.script_mongo_id || item._id || item.id)
                        return id === String(scriptId)
                    }) || null
                    if (!s && res.length > 0) {
                        // If exact match not found, log and fall back to first item for visibility, but warn.
                        console.warn('[ConversationPage] did not find exact script match for', scriptId, 'falling back to first result')
                        s = res[0]
                    }
                } else {
                    s = res
                }
                setScript(s)
                console.log('[ConversationPage] script from API', s)
            })
            .catch(err => {
                console.error('[ConversationPage] failed to load script', err)
                setScript(null)
            })
            .finally(() => { if (mounted) setLoading(false) })

        return () => { mounted = false }
    }, [scriptId])

    if (loading) {
        return <div style={{ padding: 12 }}>Loading script…</div>
    }

    // Pass the navigation initialSession (if any) directly to the PracticeChatContent.
    // Per strict rules, PracticeChatContent must read keywords and reference_utterances from session.turn.
    const sessionObj = state?.initialSession ?? undefined

    return (
        <div style={{ padding: 12 }}>
            <PracticeChatContent
                script={script ?? undefined}
                session={sessionObj}
            />
        </div>
    )
}
