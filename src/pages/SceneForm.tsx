import React, { useEffect, useState } from 'react'
import { createScene, updateScene, getScene } from '../api/scenes'
import { Form, Input, InputNumber, notification, Button } from 'antd'

type Scene = Record<string, any>

interface Props {
    scene?: Scene
    onSaved?: () => void
}

export default function SceneForm({ scene, onSaved }: Props): JSX.Element {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let mounted = true
        async function loadFullSceneIfNeeded() {
            if (scene) {
                const sceneKey = scene.scene_key ?? scene.key ?? ''
                // preload form fields
                form.setFieldsValue({ key: String(sceneKey) })

                if (scene.title !== undefined || scene.short_description !== undefined || scene.difficulty !== undefined) {
                    form.setFieldsValue({
                        title: scene.title ?? '',
                        short_description: scene.short_description ?? '',
                        difficulty: scene.difficulty ?? undefined,
                    })
                } else if (sceneKey) {
                    try {
                        const full = await getScene(String(sceneKey))
                        if (!mounted) return
                        form.setFieldsValue({
                            title: full.title ?? '',
                            short_description: full.short_description ?? '',
                            difficulty: full.difficulty ?? undefined,
                        })
                    } catch (err) {
                        console.error('[SceneForm] getScene failed', err)
                        if (!mounted) return
                        form.setFieldsValue({ title: '', short_description: '', difficulty: undefined })
                        notification.error({ message: 'Failed to load scene', description: (err as any)?.message })
                    }
                } else {
                    form.setFieldsValue({ title: '', short_description: '', difficulty: undefined })
                }
            } else {
                form.resetFields()
            }
        }

        loadFullSceneIfNeeded()
        return () => { mounted = false }
    }, [scene, form])

    const isEdit = !!scene

    function validateValues(values: any): string | null {
        if (!values.key || String(values.key).trim() === '') return 'Key is required.'
        if (!values.title || String(values.title).trim() === '') return 'Title is required.'
        if (values.difficulty !== undefined && values.difficulty !== null) {
            const n = Number(values.difficulty)
            if (Number.isNaN(n)) return 'Difficulty must be a number.'
        }
        return null
    }

    async function onFinish(values: any) {
        setLoading(true)
        try {
            const validationError = validateValues(values)
            if (validationError) {
                notification.error({ message: 'Validation error', description: validationError })
                return
            }

            const difficultyValue = values.difficulty === undefined || values.difficulty === null ? undefined : Number(values.difficulty)

            if (isEdit) {
                // Try to fetch existing id/world_id if missing
                let existingId: number | undefined = (scene as any)?.id
                let existingWorldId: number | undefined = (scene as any)?.world_id

                if (existingId === undefined || existingWorldId === undefined) {
                    try {
                        const fullFromServer = await getScene(String(scene!.scene_key ?? scene!.key ?? ''))
                        const idVal = (fullFromServer as any).id
                        if (typeof idVal === 'number') existingId = idVal
                        const wid = (fullFromServer as any).world_id
                        if (typeof wid === 'number') existingWorldId = wid
                    } catch (err) {
                        console.warn('[SceneForm] failed to fetch full scene before update', err)
                    }
                }

                if (existingId === undefined) {
                    notification.error({ message: 'Cannot update', description: 'Missing numeric id for scene (server expects id).' })
                    return
                }
                if (existingWorldId === undefined) {
                    notification.error({ message: 'Cannot update', description: 'Missing numeric world_id for scene (server expects world_id).' })
                    return
                }

                const full: any = {
                    ...(scene || {}),
                    key: values.key,
                    id: existingId,
                    world_id: existingWorldId,
                    title: values.title,
                    short_description: values.short_description || undefined,
                }
                if (difficultyValue !== undefined) full.difficulty = difficultyValue

                await updateScene(String(scene!.scene_key ?? scene!.key ?? ''), full)
                onSaved?.()
                return
            }

            const payload: any = {
                key: values.key,
                title: values.title,
                short_description: values.short_description || undefined,
            }
            if (difficultyValue !== undefined && !Number.isNaN(difficultyValue)) payload.difficulty = difficultyValue

            await createScene(payload)
            onSaved?.()
        } catch (err: any) {
            console.error('[SceneForm] submit error', err)
            const msg = err && ((err.body && (err.body.error || err.body.message)) || err.message) || String(err)
            notification.error({ message: 'Submit error', description: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ difficulty: undefined }}>
            <Form.Item name="key" label="Key" rules={[{ required: true, message: 'Key is required' }]}>
                <Input disabled={isEdit} />
            </Form.Item>
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
                <Input />
            </Form.Item>
            <Form.Item name="short_description" label="Short Description">
                <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="difficulty" label="Difficulty">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
            </Form.Item>
        </Form>
    )
}
