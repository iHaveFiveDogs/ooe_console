import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, To, NavigateFunction } from 'react-router-dom';
import SceneList from './pages/SceneList';
import WorldList from './pages/WorldList';
import WorldSelector from './pages/WorldSelector';
import { listWorlds } from './api/worlds';
import type { World } from './types/world';
import SceneBuilderLayout from './layouts/SceneBuilderLayout';
import ContentScriptsPage from './pages/ContentScriptsPage'
import SceneExpansionPage from './pages/SceneExpansionPage';

export default function App(): JSX.Element {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [selectedWorldKey, setSelectedWorldKey] = useState<string | undefined>(undefined);

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
        return <SceneList worldKey={selectedWorldKey} onStart={(id: string) => { /* removed navigation to conversation */ }} />
    }

    return (
        <BrowserRouter>
            <div className="app-container">
                <Routes>
                    {/* Legacy redirects: some older links use /expansion/... — map them to new routes */}
                    <Route path="/expansion" element={<Navigate to="/scene/expansion" replace />} />
                    <Route path="/expansion/*" element={<Navigate to="/scene/expansion" replace />} />

                    {/* Redirect root to /scene */}
                    <Route path="/" element={<Navigate to="/scene" replace />} />

                    {/* Main user area - removed as no user part */}
                    {/* <Route path="/" element={<MainLayout />}>
                        <Route path="profile" element={<div style={{ padding: 12 }}><h2>Profile</h2></div>} />
                    </Route> */}

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