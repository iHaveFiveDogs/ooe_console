import React from 'react'
import styles from './LearnerPrompt.module.css'

type LearnerPromptProps = {
    goal: string;
    tips: string[];
};

export function LearnerPrompt({ goal, tips }: LearnerPromptProps) {
    return (
        <div className={styles.card}>
            <div className={styles.title}>🎯 What to do now</div>
            <div className={styles.goal}>{goal}</div>

            <ul className={styles.tips}>
                {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                ))}
            </ul>
        </div>
    )
}
