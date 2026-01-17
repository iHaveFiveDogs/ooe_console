import React, { useState } from 'react'
import { Select, Input, Button, notification } from 'antd'
import { createWorldRolePairRule, updateWorldRolePairRule } from '../api/worldRolePairRules'

export default function WorldRolePairRuleForm({ rule, onSaved, worlds = [], rolePairs = [] }: { rule?: any, onSaved?: () => void, worlds?: any[], rolePairs?: any[] }) {
    const [values, setValues] = useState<any>({
        world_key: rule?.world_key ?? '',
        role_pair_id: rule?.role_pair_id ?? (rolePairs?.[0]?.id ?? undefined),
        weight: rule?.weight ?? 1,
        allowed: rule?.allowed ?? true,
        notes: rule?.notes ?? ''
    })

    async function submit() {
        try {
            if (rule) {
                await updateWorldRolePairRule(rule.id, { ...rule, ...values })
                notification.success({ message: 'World role-pair rule updated' })
            } else {
                await createWorldRolePairRule(values)
                notification.success({ message: 'World role-pair rule created' })
            }
            onSaved?.()
        } catch (e: any) {
            console.error('world role-pair rule save failed', e)
            notification.error({ message: '保存失败', description: e?.message || String(e) })
        }
    }

    return (
        <div>
            <div style={{ display: 'grid', gap: 8 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>World</div>
                    <Select style={{ width: '100%' }} value={values.world_key} onChange={(v) => setValues((p: any) => ({ ...p, world_key: v }))}>
                        {worlds.map(w => <Select.Option key={w.key} value={w.key}>{w.name}</Select.Option>)}
                    </Select>
                </div>

                <div>
                    <div style={{ fontWeight: 700 }}>Role Pair</div>
                    <Select style={{ width: '100%' }} value={values.role_pair_id} onChange={(v) => setValues((p: any) => ({ ...p, role_pair_id: v }))}>
                        {rolePairs.map((rp: any) => <Select.Option key={rp.id} value={rp.id}>{rp.initiator_role} / {rp.responder_role} (id:{rp.id})</Select.Option>)}
                    </Select>
                </div>

                <div>
                    <div style={{ fontWeight: 700 }}>Weight</div>
                    <Input type="number" value={values.weight} onChange={(e) => setValues((p: any) => ({ ...p, weight: Number((e.target as HTMLInputElement).value) }))} />
                </div>

                <div>
                    <div style={{ fontWeight: 700 }}>Allowed</div>
                    <Select value={values.allowed ? 'yes' : 'no'} onChange={(v) => setValues((p: any) => ({ ...p, allowed: v === 'yes' }))}>
                        <Select.Option value="yes">Yes</Select.Option>
                        <Select.Option value="no">No</Select.Option>
                    </Select>
                </div>

                <div>
                    <div style={{ fontWeight: 700 }}>Notes</div>
                    <Input.TextArea rows={3} value={values.notes} onChange={(e) => setValues((p: any) => ({ ...p, notes: (e.target as HTMLTextAreaElement).value }))} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => onSaved && onSaved()}>Cancel</Button>
                    <Button type="primary" onClick={() => submit()}>Save</Button>
                </div>
            </div>
        </div>
    )
}
