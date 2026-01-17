import React, { useEffect, useRef, useState } from 'react'
import { listWorlds } from '../api/worlds'
import type { World } from '../types/world'

interface Props {
    value?: string
    onChange: (worldKey?: string) => void
}

export default function WorldSelector({ value, onChange }: Props): JSX.Element {
    console.log('[WorldSelector] render')
    const [worlds, setWorlds] = useState<World[]>([])
    const selectRef = useRef<HTMLSelectElement | null>(null)

    useEffect(() => {
        let mounted = true
        listWorlds()
            .then(res => {
                if (!mounted) return
                setWorlds(res)
            })
            .catch(() => { })
        return () => { mounted = false }
    }, [])

    // Log when mounted / when worlds update (helps confirm fetch and render)
    useEffect(() => {
        console.log('[WorldSelector] mounted, worlds =', worlds)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [worlds])

    // Attach native DOM listeners as a fallback if React onChange is intercepted
    useEffect(() => {
        const sel = selectRef.current
        if (!sel) return

        const handler = () => {
            try {
                console.log('[WorldSelector:DOM]', sel.value)
                onChange(sel.value || undefined)
            } catch (err) {
                console.error('[WorldSelector:DOM] handler error', err)
            }
        }

        sel.addEventListener('change', handler)
        sel.addEventListener('click', handler)

        return () => {
            sel.removeEventListener('change', handler)
            sel.removeEventListener('click', handler)
        }
        // only run on mount/unmount for the select element
    }, [])

    return (
        <div className="module-wrapper">
            <label>
                <strong>Select a world by name:</strong>
            </label>
            <div className="select-row">
                <select
                    ref={selectRef}
                    value={value ?? ''}
                    onChange={e => {
                        console.log('[WorldSelector] onChange fired, raw value =', e.target.value)
                        onChange(e.target.value || undefined)
                    }}
                >
                    <option value="">Please select a world</option>
                    {worlds.map(w => (
                        <option key={w.key} value={w.key}>{w.name}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}
