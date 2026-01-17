import React from 'react'

type TurnHeaderProps = {
    stepIndex?: number
    currentStep?: string
    currentIntention?: string
    hint?: string
    feedback?: string
    examples?: string[]
}

export function TurnHeader({ stepIndex, currentStep, currentIntention, hint, feedback, examples }: TurnHeaderProps) {
    return (
        <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Step</div>
                    <div style={{ fontWeight: 700 }}>{currentStep ?? `Step ${stepIndex ?? 0}`}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Intention</div>
                    <div style={{ fontWeight: 600 }}>{currentIntention ?? '-'}</div>
                </div>
            </div>

            {hint ? (
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8, color: '#374151', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                    {hint}
                </div>
            ) : null}

            {feedback ? (
                <div style={{ background: '#fff7ed', padding: 8, borderRadius: 8, color: '#92400e', fontSize: 13 }}>
                    <strong>Feedback:</strong> {feedback}
                </div>
            ) : null}

            {examples && examples.length > 0 ? (
                <div style={{ fontSize: 13, color: '#374151' }}>
                    <div style={{ fontWeight: 600 }}>Examples</div>
                    <ul style={{ marginTop: 6 }}>
                        {examples.map((ex) => (<li key={ex}><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ex}</pre></li>))}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}
