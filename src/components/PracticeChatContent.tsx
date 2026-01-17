import React, { useEffect, useRef, useState } from 'react'

type Message = {
    id: string
    speaker?: string
    role?: string
    text: string
    avatar?: string
}

export default function PracticeChatContent({ vocabConstraints, script, session }: { vocabConstraints?: { required_any?: string[]; required_all?: string[]; optional?: string[]; forbidden?: string[] }, script?: { intro_text?: string; learning_goal?: string; learner_role?: string; scene?: any }, session?: any } = {}): JSX.Element {
    console.log('[PracticeChatContent] received script', script)
    console.log('[PracticeChatContent] received session', session)

    // Per strict rules: reference_utterances MUST be the structured array provided by backend.
    // Schema (strict): Array<{ speaker: 'initiator'|'responder', role: string, utterance: string }>
    const rawReference = session?.turn?.reference_utterances
    let referenceUtterances: any[] | undefined = undefined
    if (Array.isArray(rawReference) && rawReference.length > 0) {
        const valid = rawReference.every((it: any) => {
            return it && (it.speaker === 'initiator' || it.speaker === 'responder') && typeof it.role === 'string' && typeof it.utterance === 'string'
        })
        if (valid) {
            referenceUtterances = rawReference
        } else {
            console.error('[PracticeChatContent] reference_utterances does not match strict schema. No legacy parsing allowed.', rawReference)
            referenceUtterances = undefined
        }
    } else {
        referenceUtterances = undefined
    }
    const keywordsFromSession = session?.turn?.keywords
    console.log('[PracticeChatContent] referenceUtterances', referenceUtterances)
    console.log('[PracticeChatContent] keywordsFromSession', keywordsFromSession)

    // Restore simple UI state
    const [stage] = useState({ index: 1, total: 3, title: 'Raise Issue' })
    const [bgOpen, setBgOpen] = useState(true)

    // Determine YOU speaker per strict rules:
    // If script.learner_role is 'initiator' or 'responder', YOU = that speaker.
    // Otherwise, if learner_role is a role name (e.g. 'parent'), find which speaker in referenceUtterances has that role and set YOU accordingly.
    const rawLearnerRole = script && script.learner_role ? String(script.learner_role) : undefined
    let youSpeaker: string | undefined = undefined
    if (rawLearnerRole) {
        const low = rawLearnerRole.toLowerCase()
        if (low === 'initiator' || low === 'responder') {
            youSpeaker = low
        } else if (referenceUtterances) {
            const match = referenceUtterances.find((u: any) => String(u.role || '').toLowerCase() === low)
            if (match) youSpeaker = match.speaker
        }
    }

    // Messages: start with reference utterances (preserve speaker & role), then append learner messages
    const initialMessagesFromSession: Message[] = referenceUtterances ? referenceUtterances.map((u: any, i: number) => ({ id: String(i), speaker: u.speaker, role: u.role, text: u.utterance })) : []

    const [messages, setMessages] = useState<Message[]>(() => initialMessagesFromSession.length ? initialMessagesFromSession : [])
    const [input, setInput] = useState('')

    // Dynamic placeholder: prefer learner_role from script; otherwise use generic text without a hardcoded role
    const placeholderText = rawLearnerRole && (rawLearnerRole.toLowerCase() === 'initiator' || rawLearnerRole.toLowerCase() === 'responder')
        ? 'Type what YOU would say...'
        : rawLearnerRole ? `Type what YOU would say as the ${rawLearnerRole.toLowerCase()}...` : 'Type what YOU would say...'

    const scrollRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages])

    function sendMessage() {
        const trimmed = input.trim()
        if (!trimmed) return
        // For outgoing learner messages, set speaker to youSpeaker (if known) and role to script.learner_role when it's a role-name
        const speakerOut = youSpeaker ?? 'responder'
        const roleOut = rawLearnerRole && rawLearnerRole.toLowerCase() !== 'initiator' && rawLearnerRole.toLowerCase() !== 'responder' ? rawLearnerRole : undefined
        setMessages(prev => [...prev, { id: String(Date.now()), speaker: speakerOut, role: roleOut, text: trimmed }])
        setInput('')
        setTimeout(() => {
            // simple auto-reply from 'parent' role for demo; keep as-is for now
            setMessages(prev => [...prev, { id: String(Date.now() + 1), speaker: 'initiator', role: 'parent', text: "Oh no, what's on the floor?" }])
        }, 800)
    }

    // Map keywords from session to UI groups per strict rules
    const kw = keywordsFromSession ?? undefined
    const required_all = kw?.required_all
    const required_any = kw?.required_any
    const preferred = kw?.preferred
    const forbiddenKw = kw?.forbidden

    // UI group presence: render a group only if the corresponding field exists on keywords (not undefined). If present but empty, render empty chips area.
    const showRequiredAll = required_all !== undefined && Array.isArray(required_all)
    const showRequiredAny = required_any !== undefined && Array.isArray(required_any)
    const showPreferred = preferred !== undefined && Array.isArray(preferred)
    const showForbidden = forbiddenKw !== undefined && Array.isArray(forbiddenKw)

    // examples must come from session.turn.examples (per strict rules)
    const examplesFromSession: string[] | undefined = Array.isArray(session?.turn?.examples) ? session.turn.examples : undefined
    console.log('[PracticeChatContent] examplesFromSession', examplesFromSession)
    const [examplesOpen, setExamplesOpen] = useState(true)

    return (
        <div style={{ maxWidth: 960, paddingLeft: 24, paddingRight: 24, margin: '0 auto', fontSize: 15, lineHeight: 1.6, minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="w-full">
            {/* SECTION 1: BACKGROUND CARD */}
            <div
                style={{ width: '100%', padding: '16px 20px', marginBottom: 12, borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb' }}
                aria-hidden={!bgOpen ? 'true' : 'false'}
            >
                <div style={{ fontSize: 13, fontWeight: 600 }}>🧠 Background</div>

                {/* show learner_role if provided by script */}
                {script?.learner_role && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Learner role: {script.learner_role}</div>
                )}

                {/* Background: render only script.intro_text and script.learning_goal per strict rules */}
                {script?.intro_text && (
                    (console.log('[Background] using intro_text', script?.intro_text),
                        <div data-intro-text="true" style={{ marginTop: 6, marginBottom: 6, fontSize: 14, whiteSpace: 'pre-wrap', color: '#111827' }}>
                            {script.intro_text}
                        </div>)
                )}

                {script?.learning_goal && (
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                        <strong style={{ color: '#111827' }}>🎯 Your goal:</strong>{' '}
                        <strong>{script.learning_goal}</strong>
                    </div>
                )}

                <div style={{ position: 'absolute', right: 24, marginTop: -28 }}>
                    {/* optional collapse toggle kept visually but not required to change layout */}
                </div>
            </div>

            {/* SECTION 2: INTENTION / CONSTRAINT BAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 16px', marginBottom: 12, borderRadius: 10, background: '#ffffff', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Raise Issue</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Bring up a problem you noticed in a natural way.</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Stage {stage.index} / {stage.total} — Raising an issue</div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Keywords UI: render groups only when fields exist in session.turn.keywords */}
                    {(showRequiredAll || showRequiredAny) && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ fontSize: 12, color: '#1e3a8a', marginRight: 6, fontWeight: 700 }}>Required</div>
                            {showRequiredAll && required_all!.map((w: string, i: number) => (
                                <div key={`rall-${i}`} style={{ height: 24, padding: '0 10px', borderRadius: 999, fontSize: 12, background: '#dbeafe', color: '#1e3a8a', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>{w}</div>
                            ))}
                            {showRequiredAny && required_any!.map((w: string, i: number) => (
                                <div key={`rany-${i}`} style={{ height: 24, padding: '0 10px', borderRadius: 999, fontSize: 12, background: '#eef2ff', color: '#4338ca', display: 'inline-flex', alignItems: 'center' }}>{w}</div>
                            ))}
                        </div>
                    )}

                    {showPreferred && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ fontSize: 12, color: '#6b7280', marginRight: 6 }}>Optional</div>
                            {preferred!.map((w: string, i: number) => (
                                <div key={`opt-${i}`} style={{ height: 24, padding: '0 10px', borderRadius: 999, fontSize: 12, background: '#f3f4f6', color: '#4b5563', display: 'inline-flex', alignItems: 'center' }}>{w}</div>
                            ))}
                        </div>
                    )}

                    {showForbidden && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ fontSize: 12, color: '#6b7280', marginRight: 6 }}>Avoid</div>
                            {forbiddenKw!.map((w: string, i: number) => (
                                <div key={`fbd-${i}`} style={{ height: 24, padding: '0 10px', borderRadius: 999, fontSize: 12, background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', display: 'inline-flex', alignItems: 'center' }}>{w}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 3: CHAT HISTORY AREA */}
            <div ref={scrollRef} style={{ flex: 1, minHeight: 320, maxHeight: 'calc(100vh - 360px)', padding: '12px 0', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'flex-start' }}>
                    {((Array.isArray(referenceUtterances) && referenceUtterances.length > 0) || messages.length > 0) ? (
                        messages.map(m => {
                            // m.speaker is 'initiator' or 'responder'
                            const isYou = youSpeaker ? m.speaker === youSpeaker : m.speaker === 'responder'
                            const roleLabel = typeof m.role === 'string' && m.role.length > 0 ? (m.role.charAt(0).toUpperCase() + m.role.slice(1)) : 'Other'
                            return (
                                <div key={m.id} style={{ display: 'flex', justifyContent: isYou ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isYou ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{roleLabel}</div>
                                        <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.5, background: isYou ? '#dbeafe' : '#f3f4f6' }}>
                                            {m.text}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : null
                    }
                </div>
            </div>

            {/* SECTION 4: CHAT INPUT BOX */}
            <div style={{ position: 'sticky', bottom: 0, paddingTop: 8, paddingBottom: 16, background: 'transparent' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={placeholderText}
                        style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, resize: 'none', boxSizing: 'border-box' }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                            }
                        }}
                    />

                    <button
                        onClick={() => sendMessage()}
                        disabled={input.trim() === ''}
                        style={{ height: 36, padding: '0 16px', borderRadius: 10, fontSize: 13, background: '#2563eb', color: '#ffffff', border: 'none', cursor: input.trim() === '' ? 'default' : 'pointer', opacity: input.trim() === '' ? 0.5 : 1 }}
                    >
                        Send
                    </button>
                </div>

                {/* SECTION 5: EXAMPLES AREA (from session.turn.examples) */}
                {Array.isArray(examplesFromSession) ? (
                    <div style={{ marginTop: 16, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 12, color: '#6b7280', marginRight: 6 }}>Examples</div>
                            <button
                                onClick={() => setExamplesOpen(prev => !prev)}
                                style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, padding: 4 }}
                            >
                                {examplesOpen ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {examplesOpen && (
                            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {examplesFromSession.map((ex: string, idx: number) => (
                                    <div
                                        key={`ex-${idx}`}
                                        onClick={() => setInput(ex)}
                                        title={ex}
                                        style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 8, background: '#eef2ff', color: '#1e3a8a', fontSize: 13, whiteSpace: 'normal', wordBreak: 'break-word' }}
                                    >
                                        {ex}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : session ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                        No examples found in session.turn.examples. session.turn keys: {session.turn ? Object.keys(session.turn).join(', ') : 'none'}
                    </div>
                ) : (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>No session data provided to the component.</div>
                )}
            </div>
        </div>
    )
}
