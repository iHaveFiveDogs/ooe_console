import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { NavItem } from '../components/Sidebar'

export default function MainLayout() {
    return (
        <div className="main-area">
            <Sidebar>
                <nav style={{ width: '100%' }}>
                    <NavItem to='/chat' label='Chat' icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
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
