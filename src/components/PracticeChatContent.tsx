import React, { useEffect, useRef, useState } from 'react'
import { notification } from 'antd'
import { createSessionForScript, sendSessionInput } from '../api/engine'

type Message = {
    id: string
    speaker?: string
    role?: string
    text: string
    avatar?: string
}

export default function PracticeChatContent({ vocabConstraints, script, session }: { vocabConstraints?: { required_any?: string[]; required_all?: string[]; optional?: string[]; forbidden?: string[] }, script?: { intro_text?: string; learning_goal?: string; learner_role?: string; scene?: any; script_mongo_id?: string; _id?: string }, session?: any } = {}): JSX.Element {
    // Minimal logging
    console.log('[PracticeChatContent] received script', script)
    console.log('[PracticeChatContent] received session', session)

    // Stage / UI state
    const [stage, setStage] = useState<{ index: number; total: number; title: string; hint?: string }>({ index: 1, total: 3, title: 'Raise Issue' })
    const [sceneOpen, setSceneOpen] = useState(false)
    const [turnOpen, setTurnOpen] = useState(true)
    const [sceneShownOnce, setSceneShownOnce] = useState(false)
    // examplesOpen removed: examples are always visible in TurnPanel per requirements

    // Chat state
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')

    // Engine session state
    const [engineSessionId, setEngineSessionId] = useState<string | undefined>(undefined)
    const [sending, setSending] = useState<boolean>(false)
    const [serverSessionState, setServerSessionState] = useState<any>(session ?? undefined)

    const effectiveTurn: any = (serverSessionState && serverSessionState.turn) || session?.turn || undefined
    const examplesFromSession: string[] | undefined = Array.isArray(effectiveTurn?.examples) ? effectiveTurn.examples : undefined

    // No automatic session initiation: conversation starts when learner sends first input.

    // Determine learner role / YOU speaker
    const rawLearnerRole = script && script.learner_role ? String(script.learner_role) : undefined
    let youSpeaker: string | undefined = undefined
    if (rawLearnerRole) {
        const low = rawLearnerRole.toLowerCase()
        if (low === 'initiator' || low === 'responder') youSpeaker = low
        else if (effectiveTurn?.reference_utterances) {
            const match = (effectiveTurn.reference_utterances as any[]).find(r => String(r.role || '').toLowerCase() === low)
            if (match) youSpeaker = match.speaker
        }
    }

    const placeholderText = rawLearnerRole && (rawLearnerRole.toLowerCase() === 'initiator' || rawLearnerRole.toLowerCase() === 'responder')
        ? 'Type what YOU would say...'
        : rawLearnerRole ? `Type what YOU would say as the ${rawLearnerRole.toLowerCase()}...` : 'Type what YOU would say...'

    const effectivePlaceholder = placeholderText

    const scrollRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight ?? 0, behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        const turn = effectiveTurn
        if (!turn) return
        try {
            const serverIndex = Number(turn.step_index ?? turn.stepIndex ?? NaN)
            setStage(prev => ({
                index: Number.isFinite(serverIndex) ? (serverIndex + 1) : prev.index,
                total: prev.total,
                title: String(turn.current_step ?? turn.current_intention ?? turn.currentStep ?? prev.title),
                hint: turn.hint ?? prev.hint
            }))
        } catch (e) { }
    }, [effectiveTurn])

    // Auto-open Scene drawer once at scene start if static_feedback exists
    useEffect(() => {
        try {
            const staticFb = script?.scene && (script.scene as any)?.static_feedback
            if (staticFb && !sceneShownOnce) {
                setSceneOpen(true)
                setSceneShownOnce(true)
            }
        } catch (e) { /* noop */ }
    }, [script, sceneShownOnce])

    function resolveScriptId(): string | undefined {
        return (script && (script.script_mongo_id || (script as any)._id || (script as any).id)) ? String(script.script_mongo_id || (script as any)._id || (script as any).id) : undefined
    }

    async function ensureEngineSession() {
        if (engineSessionId) return engineSessionId
        const sidCandidate = resolveScriptId()
        if (!sidCandidate) {
            notification.error({ message: 'Cannot create session', description: 'Missing script id.' })
            throw new Error('Missing script id')
        }
        try {
            const res = await createSessionForScript(String(sidCandidate))
            const sid = (res && (res.session && (res.session.id || (res.session as any).sessionId))) || (res && (res.sessionId || (res as any).session_id)) || (res as any).id || undefined
            if (!sid && typeof res === 'string') {
                setEngineSessionId(String(res))
                return String(res)
            }
            if (!sid) {
                throw new Error('Unexpected createSession response')
            }
            setEngineSessionId(String(sid))
            if (res && res.session) setServerSessionState(res.session)
            return String(sid)
        } catch (err: any) {
            notification.error({ message: 'Cannot create session', description: err?.message || String(err) })
            throw err
        }
    }

    async function sendMessage() {
        const trimmed = input.trim()
        if (!trimmed) return

        const speakerOut = youSpeaker ?? 'responder'
        const roleOut = rawLearnerRole && rawLearnerRole.toLowerCase() !== 'initiator' && rawLearnerRole.toLowerCase() !== 'responder' ? rawLearnerRole : undefined

        const optimisticId = `opt-${Date.now()}`
        const optimisticMsg: Message = { id: optimisticId, speaker: speakerOut, role: roleOut, text: trimmed }
        setMessages(prev => [...prev, optimisticMsg])
        setInput('')

        const assistantSpeaker = youSpeaker ? (youSpeaker === 'initiator' ? 'responder' : 'initiator') : 'initiator'
        const loadingId = `loading-${Date.now()}`
        setMessages(prev => [...prev, { id: loadingId, speaker: assistantSpeaker, text: 'thinking...' }])

        setSending(true)
        try {
            const sid = await ensureEngineSession()
            const resp = await sendSessionInput(String(sid), trimmed)
            if (resp && resp.session) setServerSessionState(resp.session)

            const serverTurn = resp?.turn ?? resp?.state ?? (resp?.session && resp.session.turn) ?? undefined
            if (serverTurn) {
                setServerSessionState((prev: any) => ({ ...(prev || {}), turn: serverTurn }))
                try {
                    const serverIndex = Number(serverTurn.step_index ?? serverTurn.stepIndex ?? NaN)
                    setStage(prev => ({
                        index: Number.isFinite(serverIndex) ? (serverIndex + 1) : prev.index,
                        total: prev.total,
                        title: String(serverTurn.current_step ?? serverTurn.current_intention ?? serverTurn.currentStep ?? prev.title),
                        hint: serverTurn.hint ?? prev.hint
                    }))
                } catch (e) { }
            }

            // collect messages from many possible shapes
            let respMessages: any[] = []
            if (Array.isArray(resp?.messages)) respMessages = resp.messages
            else if (resp?.messages && Array.isArray(resp.messages.new_messages)) respMessages = resp.messages.new_messages
            else if (resp?.assistant) respMessages = [{ role: 'assistant', content: resp.assistant }]
            else if (Array.isArray(resp?.new_messages)) respMessages = resp.new_messages
            else if (typeof resp === 'string') respMessages = [{ role: 'assistant', content: resp }]

            // Helper: extract plain text from server message shape
            function extractTextFromServerMessage(m: any): string {
                try {
                    if (typeof m === 'string') return m
                    return String(m?.content ?? m?.message ?? m?.text ?? '')
                } catch (e) { return '' }
            }

            // Classify instructional messages and drop them — TurnPanel is authoritative
            function isInstructionalText(s: string): boolean {
                if (!s) return false
                const low = s.toLowerCase()
                return (
                    s.startsWith('Step ') ||
                    (low.includes('stage') && low.includes('/')) ||
                    s.includes('🧩') ||
                    low.includes('🎯 current intention') ||
                    low.includes('try to include') ||
                    low.includes('required (any)') ||
                    low.includes('required (all)') ||
                    low.includes('preferred') ||
                    low.includes('avoid')
                )
            }

            // Remove instructional messages entirely from server response
            respMessages = (respMessages || []).filter((m: any) => {
                const txt = extractTextFromServerMessage(m)
                return !isInstructionalText(txt)
            })

            // filter out server echoes of user input
            const filtered = (respMessages || []).filter((m: any) => {
                try {
                    const role = m?.role
                    const content = (m?.content ?? m?.message ?? m?.text ?? '')
                    if (role === 'user' && String(content).trim() === trimmed) return false
                    return true
                } catch (e) { return true }
            })

            const newMsgs: Message[] = filtered.map((m: any, i: number) => {
                const rawText = m?.content ?? m?.message ?? m?.text ?? ''
                let text: string
                if (typeof rawText === 'string') text = rawText
                else if (rawText == null) text = ''
                else {
                    try { text = JSON.stringify(rawText) } catch (e) { text = String(rawText) }
                }
                const sp = (m?.role === 'assistant') ? assistantSpeaker : (m?.role === 'user' ? speakerOut : assistantSpeaker)
                return { id: `srv-${Date.now()}-${i}`, speaker: sp, role: undefined, text }
            })

            setMessages(prev => {
                const withoutLoading = prev.filter(m => m.id !== loadingId)
                return [...withoutLoading, ...newMsgs]
            })
        } catch (err: any) {
            setMessages(prev => prev.filter(m => !String(m.id).startsWith('loading-')))
            notification.error({ message: 'Send failed', description: err?.message || String(err) })
        } finally {
            setSending(false)
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight ?? 0, behavior: 'smooth' }), 50)
        }
    }

    // Keywords mapping
    const kw = effectiveTurn?.keywords
    const required_all = kw?.required_all
    const required_any = kw?.required_any
    const preferred = kw?.preferred
    const forbiddenKw = kw?.forbidden

    const showRequiredAll = required_all !== undefined && Array.isArray(required_all)
    const showRequiredAny = required_any !== undefined && Array.isArray(required_any)
    const showPreferred = preferred !== undefined && Array.isArray(preferred)
    const showForbidden = forbiddenKw !== undefined && Array.isArray(forbiddenKw)

    // Render - strict 4-block layout inside a centered 920px container
    return (
        <main style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
            <div style={{ width: 920, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: 16, boxSizing: 'border-box' }}>

                {/* Scene drawer (collapsed by default, only render scene.static_feedback when present) */}
                <section style={{ height: sceneOpen ? 'auto' : 32, overflow: 'hidden', transition: 'height 180ms ease' }}>
                    <div role="button" aria-expanded={sceneOpen} onClick={() => setSceneOpen(s => !s)} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ fontWeight: 700 }}>🧠 Introduction(click open)</div>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>{sceneOpen ? '▾' : '▸'}</div>
                    </div>
                    {sceneOpen && (
                        <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: '#fff', border: 'none' }}>
                            {script?.scene && (script.scene as any)?.static_feedback ? (
                                <div style={{ whiteSpace: 'pre-wrap', color: '#111827' }}>{(script.scene as any).static_feedback}</div>
                            ) : (
                                <div style={{ whiteSpace: 'pre-wrap', color: '#111827' }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>the story</div>
                                    <div style={{ marginBottom: 6 }}>Role: {script?.learner_role ?? 'Learner'}</div>
                                    <div style={{ marginBottom: 12 }}>{(script?.scene && (typeof script.scene === 'string' ? script.scene : script.scene.context)) ?? script?.intro_text ?? ''}</div>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>learning goal:</div>
                                    <div>{script?.learning_goal ?? ''}</div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Step / Turn panel (always visible, now collapsible) */}
                <section style={{ padding: 12, borderRadius: 12, background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div onClick={() => setTurnOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 700 }}>🧩 learning tips </div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{turnOpen ? '▾' : '▸'}</div>

                        </div>
                    </div>

                    {turnOpen && (
                        <div>
                            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}> Stage {stage.index} / {stage.total}</div>
                            <div style={{ color: '#374151', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}> Current intention:</div>
                                <div>{effectiveTurn?.current_intention ?? stage.title}</div>
                                {/* hint intentionally removed from TurnPanel rendering to avoid duplicated instructional text in chat */}
                            </div>

                            {/* Examples (always visible) */}
                            {Array.isArray(examplesFromSession) && examplesFromSession.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Example chat</div>
                                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {examplesFromSession.map((ex, i) => (
                                            <div key={i} style={{ whiteSpace: 'pre-wrap', padding: 8, borderRadius: 8, background: '#f9fafb', color: '#111827', fontSize: 13 }}>
                                                {String(ex)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Keywords header on its own line, then a 4-column table for Required (all), Required (any), Preferred, Avoid */}
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>Keywords:</div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e6edf3' }}>Required (all)</th>
                                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e6edf3' }}>Required (any)</th>
                                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e6edf3' }}>Preferred</th>
                                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e6edf3' }}>Avoid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '8px', verticalAlign: 'top', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{Array.isArray(required_all) ? required_all.join(', ') : ''}</td>
                                            <td style={{ padding: '8px', verticalAlign: 'top', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{Array.isArray(required_any) ? required_any.join(', ') : ''}</td>
                                            <td style={{ padding: '8px', verticalAlign: 'top', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{Array.isArray(preferred) ? preferred.join(', ') : ''}</td>
                                            <td style={{ padding: '8px', verticalAlign: 'top', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{Array.isArray(forbiddenKw) ? forbiddenKw.join(', ') : ''}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>


                            {/* Persistent feedback from authoritative turn (always visible when present) */}
                            {effectiveTurn?.feedback ? (
                                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fff7ed', border: '1px solid #ffedd5', color: '#92400e' }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Hints</div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{String(effectiveTurn.feedback)}</div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </section>

                {/* Chat area (flex:1, scrollable, only messages) */}
                <section ref={scrollRef} style={{ flex: 1, overflowY: 'auto', marginTop: 8, paddingRight: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {messages.length > 0 ? (
                            messages.map(m => {
                                const exampleSet = new Set<string>(Array.isArray(examplesFromSession) ? examplesFromSession : [])
                                if (exampleSet.size > 0 && exampleSet.has(m.text)) return null

                                // filter out scene / intro duplicates
                                const sceneTextCandidates: string[] = []
                                if (script?.scene) {
                                    if (typeof script.scene === 'string') sceneTextCandidates.push(script.scene)
                                    else if ((script.scene as any).context) sceneTextCandidates.push((script.scene as any).context)
                                    if ((script.scene as any).static_feedback) sceneTextCandidates.push((script.scene as any).static_feedback)
                                }
                                if (script?.intro_text) sceneTextCandidates.push(script.intro_text)
                                const matchesScene = sceneTextCandidates.some(s => s && m.text && m.text.trim() === String(s).trim())
                                if (matchesScene) return null

                                // filter out messages that duplicate the current turn/step/intent text
                                const stepTextCandidates: string[] = []
                                const turnMain = effectiveTurn?.current_step ?? effectiveTurn?.current_intention ?? stage.title
                                if (turnMain) stepTextCandidates.push(String(turnMain))
                                if (typeof effectiveTurn?.current_intention === 'string') stepTextCandidates.push(String(effectiveTurn.current_intention))
                                if (typeof effectiveTurn?.current_step === 'string') stepTextCandidates.push(String(effectiveTurn.current_step))
                                // add a formatted "Step N: ..." variant which sometimes appears in messages
                                try {
                                    stepTextCandidates.push(`Step ${stage.index}: ${String(turnMain)}`)
                                } catch (e) { /* noop */ }

                                // also consider common header variants emitted by backend
                                const extraCandidates: string[] = []
                                try { extraCandidates.push(`Stage ${stage.index} / ${stage.total}`) } catch (e) { }
                                extraCandidates.push('current intention')
                                extraCandidates.push('🎯 Current intention:')
                                extraCandidates.push(`🧩 Stage ${stage.index} / ${stage.total}`)

                                const allCandidates = [...stepTextCandidates, ...extraCandidates]

                                // normalize strings for robust comparison: collapse whitespace, remove emojis, lowercase
                                function normalizeForCompare(s: any): string {
                                    if (s == null) return ''
                                    try {
                                        return String(s)
                                            .replace(/\r?\n+/g, ' ')
                                            .replace(/\s+/g, ' ')
                                            // remove a wide set of pictographic/emoji characters
                                            .replace(/\p{Extended_Pictographic}/gu, '')
                                            .trim()
                                            .toLowerCase()
                                    } catch (e) {
                                        return String(s).trim().toLowerCase()
                                    }
                                }

                                const normMsg = normalizeForCompare(m.text)
                                const normCandidates = allCandidates.map(normalizeForCompare).filter(Boolean)

                                // match if message equals or contains any candidate, or if it contains both 'stage' and the stage index,
                                // or contains 'current intention' and the turn text
                                const matchesStep = normCandidates.some(c => c && (normMsg === c || normMsg.includes(c) || c.includes(normMsg)))
                                    || (normMsg.includes('stage') && normMsg.includes(String(stage.index)))
                                    || (normMsg.includes('current intention') && turnMain && normalizeForCompare(turnMain) && normMsg.includes(normalizeForCompare(turnMain)))

                                if (matchesStep) return null

                                const isYou = youSpeaker ? m.speaker === youSpeaker : m.speaker === 'responder'
                                const roleLabel = typeof m.role === 'string' && m.role.length > 0 ? (m.role.charAt(0).toUpperCase() + m.role.slice(1)) : (isYou ? 'You' : 'Assistant')

                                return (
                                    <div key={m.id} style={{ display: 'flex', justifyContent: isYou ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isYou ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{roleLabel}</div>
                                            <div style={{ maxWidth: '100%', padding: '10px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.5, background: isYou ? '#dbeafe' : '#f3f4f6' }}>{m.text}</div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : null}
                    </div>
                </section>

                {/* Input bar (sticky bottom) */}
                <section style={{ position: 'sticky', bottom: 0, paddingTop: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#ffffff', padding: 12, borderRadius: 12, boxShadow: '0 -1px 0 rgba(0,0,0,0.04)' }}>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={effectivePlaceholder}
                            style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, resize: 'none', boxSizing: 'border-box' }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    void sendMessage()
                                }
                            }}
                            // input enabled immediately; no auto-init wait
                            disabled={sending}
                        />

                        <button
                            onClick={() => void sendMessage()}
                            disabled={input.trim() === '' || sending}
                            style={{ height: 36, padding: '0 16px', borderRadius: 10, fontSize: 13, background: '#2563eb', color: '#ffffff', border: 'none', cursor: input.trim() === '' ? 'default' : 'pointer', opacity: input.trim() === '' ? 0.5 : 1 }}
                        >
                            {sending ? 'Thinking...' : 'Send'}
                        </button>
                    </div>
                </section>

            </div>
        </main>
    )
}
