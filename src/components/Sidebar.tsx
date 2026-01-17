import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './sidebar.css'

interface NavItemProps {
    icon?: React.ReactNode
    to: string
    label: string
    activeWhenStartsWith?: string
}

export function NavItem({ icon, to, label, activeWhenStartsWith }: NavItemProps) {
    const location = useLocation()
    const isActive = activeWhenStartsWith ? location.pathname.startsWith(activeWhenStartsWith) : location.pathname === to
    return (
        <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`} aria-current={isActive ? 'page' : undefined}>
            {icon && <span className="nav-icon">{icon}</span>}
            <span className="nav-label">{label}</span>
        </Link>
    )
}

export default function Sidebar({ children }: { children?: React.ReactNode }) {
    const [pinned, setPinned] = useState(false)

    useEffect(() => {
        if (pinned) document.body.classList.add('sidebar-expanded')
        else document.body.classList.remove('sidebar-expanded')
        return () => { document.body.classList.remove('sidebar-expanded') }
    }, [pinned])

    return (
        <aside className={`app-sidebar ${pinned ? 'pinned' : ''}`} role="navigation">
            {children}

            {/* pin toggle moved to bottom */}
            <div className="pin-area">
                <button aria-label={pinned ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => setPinned(v => !v)} className="pin-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pin-icon">
                        <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </aside>
    )
}
