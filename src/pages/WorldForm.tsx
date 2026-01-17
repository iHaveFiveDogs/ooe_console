import React, { useEffect } from 'react'
import { createWorld, updateWorld } from '../api/worlds'
import type { World } from '../types/world'
import { Form, Input, Button, notification } from 'antd'

interface Props {
    world?: World
    // onSaved may receive the saved world's key (for create or update)
    onSaved?: (savedKey?: string) => void
}

export default function WorldForm({ world, onSaved }: Props): JSX.Element {
    const [form] = Form.useForm()

    useEffect(() => {
        if (world) {
            form.setFieldsValue({ key: String(world.key ?? ''), name: world.name ?? '', description: world.description ?? '' })
        } else {
            form.resetFields()
        }
    }, [world, form])

    const isEdit = !!world

    function validate(values: any): string | null {
        if (!values.key || String(values.key).trim() === '') return 'Key is required.'
        if (!values.name || String(values.name).trim() === '') return 'Title is required.'
        return null
    }

    async function handleSubmit(values: any) {
        const validationError = validate(values)
        if (validationError) {
            notification.error({ message: 'Validation error', description: validationError })
            return
        }
        try {
            if (isEdit) {
                await updateWorld(String(world!.key ?? ''), { key: values.key, name: values.name, description: values.description || undefined })
                onSaved?.(values.key)
                return
            }
            await createWorld({ key: values.key, name: values.name, description: values.description || undefined })
            onSaved?.(values.key)
        } catch (err: any) {
            console.error('[WorldForm] submit failed', err)
            notification.error({ message: 'Submit failed', description: (err && (err.message || JSON.stringify(err))) || String(err) })
        }
    }

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="key" label="Key" rules={[{ required: true }]}>
                <Input disabled={isEdit} />
            </Form.Item>
            <Form.Item name="name" label="Title" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
                <Input />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">Save</Button>
            </Form.Item>
        </Form>
    )
}
