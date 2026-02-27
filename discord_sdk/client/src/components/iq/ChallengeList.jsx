import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import ChallengeDetail from './ChallengeDetail';
import ChallengeForm from './ChallengeForm';

export default function ChallengeList({ userId }) {
    const [challenges, setChallenges] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadChallenges(); }, []);

    async function loadChallenges() {
        try {
            const data = await api.getChallenges();
            setChallenges(data);
        } catch (err) {
            console.error('Failed to load challenges:', err);
        }
        setLoading(false);
    }

    if (loading) return <div className="iq-loading"><p>載入挑戰列表...</p></div>;

    if (selectedId) {
        const challenge = challenges.find(c => c.id === selectedId);
        return (
            <ChallengeDetail
                challenge={challenge}
                userId={userId}
                onBack={() => { setSelectedId(null); loadChallenges(); }}
            />
        );
    }

    if (showForm) {
        return (
            <ChallengeForm
                userId={userId}
                onBack={() => { setShowForm(false); loadChallenges(); }}
            />
        );
    }

    return (
        <div className="challenge-list">
            <div className="challenge-header">
                <h2 className="section-title">⚔️ 排名挑戰</h2>
                <button className="pixel-btn primary" onClick={() => setShowForm(true)}>
                    ＋ 發起挑戰
                </button>
            </div>

            {challenges.length === 0 ? (
                <div className="empty-challenges">
                    <p>目前沒有進行中的挑戰</p>
                </div>
            ) : (
                <div className="challenges-grid">
                    {challenges.map((c, i) => (
                        <motion.div
                            key={c.id}
                            className="challenge-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedId(c.id)}
                        >
                            <div className="challenge-card-header">
                                <span className="proposer">{c.proposerName}</span>
                                <span className="arrow">→</span>
                                <span className="target">{c.targetName}</span>
                            </div>
                            <div className="challenge-card-body">
                                <span className="rank-change">
                                    {c.rankChange > 0 ? `↑${c.rankChange}` : `↓${Math.abs(c.rankChange)}`}
                                </span>
                                <span className="vote-counts">
                                    👍 {c.agreeCount} / 👎 {c.disagreeCount}
                                </span>
                            </div>
                            <div className="challenge-card-footer">
                                <span className="deadline">
                                    截止：{new Date(c.votingDeadline).toLocaleDateString('zh-TW')}
                                </span>
                                <span className="comment-count">💬 {c.commentCount}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
