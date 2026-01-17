import React from 'react'
import styles from './StageProgress.module.css'

type StageProgressProps = {
    stages: string[];
    currentIndex: number;
};

export function StageProgress({ stages, currentIndex }: StageProgressProps) {
    return (
        <div className={styles.container}>
            {stages.map((stage, i) => (
                <div key={stage} className={`${styles.stage} ${i === currentIndex ? styles.active : styles.inactive}`}>
                    {stage}
                </div>
            ))}
        </div>
    )
}
