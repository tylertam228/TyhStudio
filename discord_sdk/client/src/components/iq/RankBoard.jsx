import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../utils/api';

export default function RankBoard({ userId }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRanks();
    }, []);

    async function loadRanks() {
        try {
            const data = await api.getRank();
            setUsers(data);
        } catch (err) {
            console.error('Failed to load ranks:', err);
        }
        setLoading(false);
    }

    if (loading) return <div className="iq-loading"><p>載入排名中...</p></div>;

    const ranked = users.filter(u => u.currentRank != null);
    const unranked = users.filter(u => u.currentRank == null);

    return (
        <div className="rank-board">
            <h2 className="section-title">📊 目前排名</h2>

            <div className="rank-list">
                {ranked.map((user, i) => {
                    const medal = user.currentRank === 1 ? '🥇' : user.currentRank === 2 ? '🥈' : user.currentRank === 3 ? '🥉' : null;
                    const isMe = user.id === userId;

                    return (
                        <motion.div
                            key={user.id}
                            className={`rank-item ${isMe ? 'is-me' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <span className="rank-position">
                                {medal || `#${user.currentRank}`}
                            </span>
                            <span className="rank-name">
                                {user.username}
                                {isMe && <span className="you-label">(你)</span>}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {unranked.length > 0 && (
                <div className="unranked-section">
                    <p className="unranked-label">尚未排名：</p>
                    <p className="unranked-names">{unranked.map(u => u.username).join(', ')}</p>
                </div>
            )}
        </div>
    );
}
