import React, { useEffect, useState } from 'react';
import { notification } from 'antd';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, To, NavigateFunction } from 'react-router-dom';
import SceneList from './pages/SceneList';
import WorldList from './pages/WorldList';
import WorldSelector from './pages/WorldSelector';
import { listWorlds } from './api/worlds';
import { createSessionForScript } from './api/engine'
import type { World } from './types/world';
import ConversationPage from './pages/ConversationPage';
import UserTrainingEntryPage from './pages/UserTrainingEntryPage';
import ChatPage from './pages/ChatPage';
import SceneExpansionPage from './pages/SceneExpansionPage';
import MainLayout from './layouts/MainLayout';
import SceneBuilderLayout from './layouts/SceneBuilderLayout';
import Topbar from './components/Topbar';
import ContentScriptsPage from './pages/ContentScriptsPage'

export default function App(): JSX.Element {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [selectedWorldKey, setSelectedWorldKey] = useState<string | undefined>(undefined);
    const [role, setRole] = useState<'user' | 'director'>('user')

    // Centralized start + navigate entrypoint required by pages like SceneList
    async function navigateToConversationScript(scriptMongoId: string, navigate: NavigateFunction) {
        try {
            // enforce invariant: only start via POST /engine/start with { script_mongo_id }
            const session = await createSessionForScript(String(scriptMongoId))
            const state = { script_id: String(scriptMongoId), initialSession: session }
            console.log('[App] navigateToConversationScript state =', state)
            navigate('/conversation', { state })
        } catch (err) {
            console.error('[App] Failed to start session', err)
            notification.error({ message: 'Failed to start conversation', description: ((err as any)?.message || String(err)) })
        }
    }

    useEffect(() => {
        let mounted = true;

        listWorlds()
            .then(res => {
                if (!mounted) return;
                setWorlds(res);
            })
            .catch(() => { });

        return () => { mounted = false }
    }, []);

    // Router-aware wrappers to pass navigate into children
    function StartableSceneListWrapper() {
        const navigate = useNavigate()
        return <SceneList worldKey={selectedWorldKey} onStart={(id: string) => void navigateToConversationScript(id, navigate)} />
    }

    function UserTrainingWrapper() {
        const navigate = useNavigate()
        function navigateToConversation(opts: { sceneKey: string, initialSession?: any }) {
            navigate('/conversation', { state: { sceneKey: opts.sceneKey, initialSession: opts.initialSession } })
        }
        return <UserTrainingEntryPage navigateToConversationScript={(id: string) => void navigateToConversationScript(id, navigate)} navigateToConversation={navigateToConversation} />
    }

    return (
        <BrowserRouter>
            <div className="app-container">
                <Topbar role={role} setRole={(r) => setRole(r as 'user' | 'director')} />

                <Routes>
                    {/* Legacy redirects: some older links use /expansion/... — map them to new routes */}
                    <Route path="/expansion" element={<Navigate to="/scene/expansion" replace />} />
                    <Route path="/expansion/*" element={<Navigate to="/scene/expansion" replace />} />

                    {/* Main user area */}
                    <Route path="/" element={<MainLayout />}>
                        {/* removed welcome/index content as requested */}
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="profile" element={<div style={{ padding: 12 }}><h2>Profile</h2></div>} />
                        <Route path="user-training" element={<UserTrainingWrapper />} />
                        {/* Conversation should be rendered inside MainLayout so it appears in the content area */}
                        <Route path="conversation" element={<ConversationPage />} />
                    </Route>

                    {/* Scene builder area - parent path /scene */}
                    <Route path="/scene" element={<SceneBuilderLayout />}>
                        <Route index element={<div>
                            <WorldSelector
                                value={selectedWorldKey}
                                onChange={(key) => setSelectedWorldKey(key)}
                            />
                            <StartableSceneListWrapper />
                        </div>} />
                        {/* legacy scene route removed: redirect to expansion */}
                        <Route path="scene" element={<Navigate to="/scene/expansion" replace />} />
                        <Route path="world" element={<WorldList />} />
                        <Route path="conflict" element={<Navigate to="/scene/expansion" replace />} />
                        <Route path="expansion" element={<SceneExpansionPage />} />
                        <Route path="scripts" element={<ContentScriptsPage />} />
                        <Route path="plot" element={<div>Plot Outline (todo)</div>} />
                    </Route>

                    {/* Removed standalone /conversation route so it renders inside MainLayout */}
                    <Route path="/scene-list" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}