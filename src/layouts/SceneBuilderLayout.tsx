import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { NavItem } from '../components/Sidebar'

export default function SceneBuilderLayout() {
    return (
        <div className="main-area">
            <Sidebar>
                <nav style={{ width: '100%' }}>
                    <NavItem to='/scene/world' label='Worlds' icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0f172a" strokeWidth="1.2" /></svg>} />
                    <NavItem to='/scene/expansion' label='Expansion' icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
                    <NavItem to='/scene/scripts' label='Scripts' icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
                </nav>
            </Sidebar>
            <main className="content">
                <div className="content-inner">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
