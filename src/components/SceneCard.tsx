import React from 'react'
import styles from './SceneCard.module.css'

type SceneCardProps = {
    sceneTitle: string;
    role: string;
    partner: string;
    mood?: string;
};

export function SceneCard({ sceneTitle, role, partner, mood }: SceneCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.label}>Scene</div>
            <div className={styles.title}>{sceneTitle}</div>

            <div className={styles.meta}>
                <div className={styles.metaLine}><span className={styles.metaLabel}>You:</span> {role}</div>
                <div className={styles.metaLine}><span className={styles.metaLabel}>With:</span> {partner}{mood && ` (${mood})`}</div>
            </div>
        </div>
    )
}
