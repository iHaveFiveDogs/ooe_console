import React from 'react'
import './topbar.css'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ role, setRole }: { role: 'user' | 'director', setRole: (r: 'user' | 'director') => void }) {
    const navigate = useNavigate()
    return (
        <header className="app-topbar">
            <div className="brand"></div>
            <div className="actions">
                <button className={`role-btn ${role === 'user' ? 'active' : ''}`} onClick={() => { setRole('user'); navigate('/chat') }}>
                    User
                </button>
                <button className={`role-btn ${role === 'director' ? 'active' : ''}`} onClick={() => { setRole('director'); navigate('/scene') }}>
                    Scene Builder
                </button>
            </div>
        </header>
    )
}
