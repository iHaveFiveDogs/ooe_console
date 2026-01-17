import React, { useEffect } from 'react'
import { createConflict, updateConflict } from '../api/conflicts'
import type { Conflict } from '../types/conflict'
import { Form, Input, Button, notification } from 'antd'

interface Props {
    conflict?: Conflict
    onSaved?: () => void
}

type EscalationStage = {
    stage: number
    intent: {
        initiator_intent: string
        responder_intent: string
    }
}

export default function ConflictForm({ conflict, onSaved }: Props) {
    const isEdit = !!conflict
    const [form] = Form.useForm()

    useEffect(() => {
        if (conflict) {
            form.setFieldsValue({
                key: conflict.key,
                category: conflict.category,
                short_desc: conflict.short_desc ?? '',
                escalation: Array.isArray(conflict.escalation) ? conflict.escalation : [],
                roles: conflict.roles ?? { initiator: '', responder: '' },
            })
        } else {
            form.resetFields()
        }
    }, [conflict, form])

    function validateValues(values: any): string | null {
        if (!values.roles || !values.roles.initiator || String(values.roles.initiator).trim() === '') return 'Roles: initiator is required.'
        if (!values.roles || !values.roles.responder || String(values.roles.responder).trim() === '') return 'Roles: responder is required.'
        if (values.roles && values.roles.initiator === values.roles.responder) return 'Roles: initiator and responder must be different.'
        if (!Array.isArray(values.escalation) || values.escalation.length === 0) return 'Escalation must have at least one stage.'
        for (let i = 0; i < values.escalation.length; i++) {
            const s = values.escalation[i]
            if (!s.intent || !s.intent.initiator_intent || String(s.intent.initiator_intent).trim() === '') return `Stage ${i + 1}: initiator_intent is required.`
            if (!s.intent || !s.intent.responder_intent || String(s.intent.responder_intent).trim() === '') return `Stage ${i + 1}: responder_intent is required.`
        }
        return null
    }

    async function submit(values: any) {
        try {
            const validationError = validateValues(values)
            if (validationError) {
                notification.error({ message: 'Validation error', description: validationError })
                return
            }

            if (isEdit) {
                const full: Conflict = {
                    ...conflict!,
                    category: values.category,
                    short_desc: values.short_desc || undefined,
                    escalation: values.escalation.map((s: any, idx: number) => ({ stage: idx + 1, intent: { initiator_intent: s.intent.initiator_intent, responder_intent: s.intent.responder_intent } })),
                    roles: { initiator: values.roles.initiator, responder: values.roles.responder },
                }

                await updateConflict(values.key, full)
                onSaved?.()
                return
            }

            const payload: Conflict = {
                key: values.key,
                category: values.category,
                short_desc: values.short_desc || undefined,
                escalation: values.escalation.map((s: any, idx: number) => ({ stage: idx + 1, intent: { initiator_intent: s.intent.initiator_intent, responder_intent: s.intent.responder_intent } })),
                roles: { initiator: values.roles.initiator, responder: values.roles.responder },
            }

            await createConflict(payload)
            onSaved?.()
        } catch (err: any) {
            console.error('[ConflictForm] submit failed', err)
            notification.error({ message: 'Submit failed', description: (err && (err.message || JSON.stringify(err))) || String(err) })
        }
    }

    return (
        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ escalation: [], roles: { initiator: '', responder: '' } }}>
            <Form.Item name="key" label="Key" rules={[{ required: true }]}>
                <Input disabled={isEdit} />
            </Form.Item>

            <Form.Item name="category" label="Category">
                <Input />
            </Form.Item>

            <Form.Item name="short_desc" label="Short Description">
                <Input.TextArea />
            </Form.Item>

            <Form.Item name="escalation" label="Escalation">
                {/* Render escalation summary safely as JSON string to avoid React object child error */}
                <Input.TextArea rows={4} readOnly value={(form.getFieldValue('escalation') || []).map((s: any) => JSON.stringify(s)).join('\n')} />
            </Form.Item>

            <Form.Item name={['roles', 'initiator']} label="Initiator">
                <Input />
            </Form.Item>
            <Form.Item name={['roles', 'responder']} label="Responder">
                <Input />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit">Save</Button>
            </Form.Item>
        </Form>
    )
}
