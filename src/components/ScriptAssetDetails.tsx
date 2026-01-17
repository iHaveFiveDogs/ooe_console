import React, { useState } from 'react'
import { Card, Descriptions, Typography, Tag, Empty, Input, Button, Space, Divider, notification } from 'antd'
import StyledTable from './StyledTable'
import { updateContentScript } from '../api/contentScripts'

// Editable step type (subset)
// type EditableStep = { step: number, id: string, intent: { initiator_intent: string, responder_intent: string }, reference_utterances: string[], keywords: { required_all: string[], required_any: string[], forbidden: string[], preferred: string[], level: string }, skill_description?: string | null }

function clone(obj: any) {
    return JSON.parse(JSON.stringify(obj))
}

// StepRow: manages its own editing state and local draft
function StepRow({ step, onSave, onReset }: { step: any, onSave: (s: any) => void, onReset: () => void }) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState<any>(null)
    const [saving, setSaving] = useState(false)

    function enterEdit() {
        setDraft(clone(step))
        setEditing(true)
    }

    function cancelEdit() {
        setDraft(null)
        setEditing(false)
    }

    async function saveEdit() {
        if (!draft) return
        setSaving(true)
        try {
            await onSave(draft)
            setEditing(false)
            setDraft(null)
            notification.success({ message: `Saved step ${draft.step_index ?? draft.step ?? ''}` })
        } catch (err: any) {
            console.error('Save step failed', err)
            notification.error({ message: 'Save failed', description: err?.message || String(err) })
        } finally {
            setSaving(false)
        }
    }

    function updateDraft(path: string, value: any) {
        if (!draft) return
        const next = clone(draft)
        const keys = path.split('.')
        let cur: any = next
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i]
            if (!cur[k]) cur[k] = {}
            cur = cur[k]
        }
        cur[keys[keys.length - 1]] = value
        setDraft(next)
    }

    // Utterances editing helpers
    function updateUtterance(idx: number, text: string) {
        const arr = (draft.reference_utterances || []).slice()
        arr[idx] = text
        updateDraft('reference_utterances', arr)
    }
    function addUtterance() {
        const arr = (draft.reference_utterances || []).slice()
        arr.push('')
        updateDraft('reference_utterances', arr)
    }
    function removeUtterance(idx: number) {
        const arr = (draft.reference_utterances || []).slice()
        arr.splice(idx, 1)
        updateDraft('reference_utterances', arr)
    }

    // Keywords editors: comma-separated inputs
    function updateKeywordsField(field: string, raw: string) {
        const arr = raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
        const next = clone(draft)
        if (!next.keywords) next.keywords = {}
        next.keywords[field] = arr
        setDraft(next)
    }

    const stepNumber = step.step_index ?? step.index ?? step.step ?? '—'
    const level = (editing ? (draft?.keywords?.level ?? '-') : (step.keywords?.level ?? '-'))

    return (
        <div style={{ border: '1px solid #eef2f6', padding: 12, borderRadius: 8, marginBottom: 10, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 700 }}>Step {stepNumber}</div>
                    <div style={{ marginTop: 6 }}>{step.intent?.initiator_intent || '-'} {step.intent?.responder_intent ? (<><Tag color="green">{step.intent.responder_intent}</Tag></>) : null}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Tag>{level}</Tag>
                    {!editing ? (
                        <Button size="small" onClick={enterEdit}>Edit</Button>
                    ) : (
                        <>
                            <Button size="small" type="primary" loading={saving} onClick={saveEdit}>Save</Button>
                            <Button size="small" onClick={cancelEdit}>Cancel</Button>
                            <Button size="small" danger onClick={() => { onReset(); cancelEdit(); }}>Reset</Button>
                        </>
                    )}
                </div>
            </div>

            <Divider />

            {/* Intent editor */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Intent</div>
                {!editing ? (
                    <div>
                        <Tag color="blue">{step.intent?.initiator_intent ?? '-'}</Tag>
                        <Tag color="green">{step.intent?.responder_intent ?? '-'}</Tag>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <Input value={draft.intent?.initiator_intent ?? ''} onChange={e => updateDraft('intent.initiator_intent', e.target.value)} placeholder="Initiator intent" />
                        <Input value={draft.intent?.responder_intent ?? ''} onChange={e => updateDraft('intent.responder_intent', e.target.value)} placeholder="Responder intent" />
                    </div>
                )}
            </div>

            {/* Utterances editor */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Reference Utterances</div>
                {!editing ? (
                    <div>
                        {Array.isArray(step.reference_utterances) && step.reference_utterances.length > 0 ? (
                            <ul style={{ marginTop: 6 }}>
                                {step.reference_utterances.map((u: string, i: number) => (
                                    <li key={i}><Typography.Text style={{ whiteSpace: 'pre-wrap' }}>{u}</Typography.Text></li>
                                ))}
                            </ul>
                        ) : <div style={{ color: '#9ca3af' }}>-</div>}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {(draft.reference_utterances || []).map((u: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 8 }}>
                                <Input.TextArea rows={2} value={u} onChange={e => updateUtterance(i, e.target.value)} />
                                <Button onClick={() => removeUtterance(i)} danger>Delete</Button>
                            </div>
                        ))}
                        <Button onClick={addUtterance}>+ Add Utterance</Button>
                    </div>
                )}
            </div>

            {/* Keywords editor */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Keywords</div>
                {!editing ? (
                    <div>
                        <div><strong>Required (all):</strong> {Array.isArray(step.keywords?.required_all) && step.keywords.required_all.length > 0 ? step.keywords.required_all.join(', ') : '-'}</div>
                        <div><strong>Required (any):</strong> {Array.isArray(step.keywords?.required_any) && step.keywords.required_any.length > 0 ? step.keywords.required_any.join(', ') : '-'}</div>
                        <div><strong>Forbidden:</strong> {Array.isArray(step.keywords?.forbidden) && step.keywords.forbidden.length > 0 ? step.keywords.forbidden.join(', ') : '-'}</div>
                        <div><strong>Preferred:</strong> {Array.isArray(step.keywords?.preferred) && step.keywords.preferred.length > 0 ? step.keywords.preferred.join(', ') : '-'}</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                        <Input value={(draft.keywords?.required_all || []).join(', ')} onChange={e => updateKeywordsField('required_all', e.target.value)} placeholder="required_all (comma separated)" />
                        <Input value={(draft.keywords?.required_any || []).join(', ')} onChange={e => updateKeywordsField('required_any', e.target.value)} placeholder="required_any (comma separated)" />
                        <Input value={(draft.keywords?.forbidden || []).join(', ')} onChange={e => updateKeywordsField('forbidden', e.target.value)} placeholder="forbidden (comma separated)" />
                        <Input value={(draft.keywords?.preferred || []).join(', ')} onChange={e => updateKeywordsField('preferred', e.target.value)} placeholder="preferred (comma separated)" />
                        <Input value={draft.keywords?.level ?? ''} onChange={e => updateDraft('keywords.level', e.target.value)} placeholder="Level" />
                    </div>
                )}
            </div>

            {/* Optional skill description */}
            {editing ? (
                <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 600 }}>Skill Description</div>
                    <Input.TextArea rows={2} value={draft.skill_description || ''} onChange={e => updateDraft('skill_description', e.target.value)} />
                </div>
            ) : (
                step.skill_description ? (
                    <div style={{ marginTop: 8 }}>{step.skill_description}</div>
                ) : null
            )}
        </div>
    )
}

// StepsEditor: renders StepRow for each step and manages parent-level save to API
function StepsEditor({ asset, onAssetChange }: { asset: any, onAssetChange: (newAsset: any) => void }) {
    const steps = Array.isArray(asset.steps) ? asset.steps.slice().sort((a: any, b: any) => (a.step_index ?? a.index ?? 0) - (b.step_index ?? b.index ?? 0)) : []
    const [saving, setSaving] = useState(false)

    async function saveStep(updatedStep: any) {
        // parent should update asset.steps, then call API to persist
        const nextAsset = clone(asset)
        nextAsset.steps = (nextAsset.steps || []).map((s: any) => {
            const idA = s._id || s.id || String(s.step_index ?? s.index ?? '')
            const idB = updatedStep._id || updatedStep.id || String(updatedStep.step_index ?? updatedStep.index ?? '')
            if (idA === idB) return updatedStep
            return s
        })

        // call parent's onAssetChange to update UI immediately
        onAssetChange(nextAsset)

        // perform API save for full asset
        try {
            setSaving(true)
            await updateContentScript(String(asset._id || asset.script_mongo_id || asset.id), nextAsset)
            notification.success({ message: 'Script saved' })
        } catch (err: any) {
            console.error('Failed to save script asset', err)
            notification.error({ message: 'Failed to save script', description: err?.message || String(err) })
            // revert parent change? For simplicity, keep UI updated; alternative: reload from server
        } finally {
            setSaving(false)
        }
    }

    function resetStep(stepIndex: number) {
        // parent can choose to reload or ignore; no-op here
    }

    return (
        <div>
            {steps.length === 0 ? <Empty description="No steps" /> : (
                <div style={{ display: 'grid', gap: 8 }}>
                    {steps.map((s: any) => (
                        <StepRow key={s._id || s.id || `${s.step_index || s.index || 0}`} step={s} onSave={saveStep} onReset={() => resetStep(s)} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function ScriptAssetDetails({ asset: initialAsset }: { asset: any }) {
    const [asset, setAsset] = useState<any>(initialAsset)

    // update local asset if prop changes
    React.useEffect(() => { setAsset(initialAsset) }, [initialAsset])

    function handleAssetChange(nextAsset: any) {
        setAsset(nextAsset)
    }

    return (
        <Card size="default" style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 12 }}>
                <Descriptions size="small" column={2} bordered>
                    <Descriptions.Item label="Script Key" span={2}>{asset.script_key ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Scene Key">{asset.scene_key ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Conflict Key">{asset.conflict_key ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Learner Role">{asset.learner_role ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Learning Goal" span={2}>{asset.learning_goal ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Version">{asset.version ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Model">{asset.model ?? '-'}</Descriptions.Item>
                </Descriptions>
            </div>

            {asset.intro_text ? (
                <div style={{ marginBottom: 12 }}>
                    <Typography.Paragraph>{asset.intro_text}</Typography.Paragraph>
                </div>
            ) : null}

            <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Steps</div>
                <StepsEditor asset={asset} onAssetChange={handleAssetChange} />
            </div>
        </Card>
    )
}
