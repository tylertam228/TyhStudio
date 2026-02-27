import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { api } from '../../utils/api';

export default function ChallengeDetail({ challenge, userId, onBack }) {
    const [comments, setComments] = useState([]);
    const [myVote, setMyVote] = useState(challenge?.myVote ?? null);
    const [agreeCount, setAgreeCount] = useState(challenge?.agreeCount ?? 0);
    const [disagreeCount, setDisagreeCount] = useState(challenge?.disagreeCount ?? 0);
    const [newStance, setNewStance] = useState('agree');
    const [newContent, setNewContent] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!challenge) return;
        loadComments();

        const socketUrl = window.location.origin;
        const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
            socket.emit('iq_join_challenge', { challengeId: challenge.id });
        });

        socket.on('iq_comment_added', (comment) => {
            setComments(prev => [...prev, comment]);
        });

        socket.on('iq_vote_changed', ({ agreeCount: a, disagreeCount: d }) => {
            setAgreeCount(a);
            setDisagreeCount(d);
        });

        return () => {
            socket.emit('iq_leave_challenge', { challengeId: challenge.id });
            socket.disconnect();
        };
    }, [challenge]);

    async function loadComments() {
        try {
            const data = await api.getComments(challenge.id);
            setComments(data);
        } catch (err) {
            console.error('Failed to load comments:', err);
        }
    }

    async function handleVote(vote) {
        try {
            await api.voteChallenge(challenge.id, vote);
            setMyVote(vote);
            const newAgree = vote === 'agree'
                ? agreeCount + (myVote === 'agree' ? 0 : 1)
                : agreeCount - (myVote === 'agree' ? 1 : 0);
            const newDisagree = vote === 'disagree'
                ? disagreeCount + (myVote === 'disagree' ? 0 : 1)
                : disagreeCount - (myVote === 'disagree' ? 1 : 0);
            setAgreeCount(Math.max(0, newAgree));
            setDisagreeCount(Math.max(0, newDisagree));
        } catch (err) {
            console.error('Vote failed:', err);
        }
    }

    async function handleComment(e) {
        e.preventDefault();
        if (!newContent.trim()) return;
        setSending(true);
        try {
            await api.addComment(challenge.id, newStance, newContent.trim());
            setNewContent('');
            await loadComments();
        } catch (err) {
            console.error('Comment failed:', err);
        }
        setSending(false);
    }

    async function handleWithdraw() {
        try {
            await api.withdrawChallenge(challenge.id);
            onBack();
        } catch (err) {
            alert(err.message);
        }
    }

    if (!challenge) return null;

    const direction = challenge.rankChange > 0
        ? `升 ${challenge.rankChange} 位`
        : `降 ${Math.abs(challenge.rankChange)} 位`;

    return (
        <div className="challenge-detail">
            <button className="pixel-btn back-btn" onClick={onBack}>← 返回</button>

            <div className="detail-header">
                <h2>{challenge.proposerName} → {challenge.targetName}</h2>
                <span className="detail-change">{direction}</span>
            </div>

            <div className="detail-reason">
                <h3>理由</h3>
                <p>{challenge.reason}</p>
            </div>

            <div className="detail-deadline">
                截止：{new Date(challenge.votingDeadline).toLocaleString('zh-TW')}
            </div>

            <div className="vote-section">
                <h3>你的立場</h3>
                <div className="vote-buttons">
                    <button
                        className={`vote-btn agree ${myVote === 'agree' ? 'active' : ''}`}
                        onClick={() => handleVote('agree')}
                    >
                        👍 同意 ({agreeCount})
                    </button>
                    <button
                        className={`vote-btn disagree ${myVote === 'disagree' ? 'active' : ''}`}
                        onClick={() => handleVote('disagree')}
                    >
                        👎 反對 ({disagreeCount})
                    </button>
                </div>
            </div>

            {challenge.proposerId === userId && (
                <button className="pixel-btn danger" onClick={handleWithdraw}>撤回提案</button>
            )}

            <div className="comments-section">
                <h3>討論板 ({comments.length})</h3>

                <div className="comments-list">
                    {comments.map((c, i) => (
                        <motion.div
                            key={c.id}
                            className={`comment-item ${c.stance}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <div className="comment-header">
                                <span className="comment-author">{c.authorName}</span>
                                <span className={`comment-stance ${c.stance}`}>
                                    {c.stance === 'agree' ? '👍 同意' : '👎 反對'}
                                </span>
                            </div>
                            <p className="comment-content">{c.content}</p>
                            <span className="comment-time">
                                {new Date(c.createdAt).toLocaleString('zh-TW')}
                            </span>
                        </motion.div>
                    ))}
                </div>

                <form onSubmit={handleComment} className="comment-form">
                    <div className="stance-select">
                        <button type="button" className={`stance-btn ${newStance === 'agree' ? 'active' : ''}`}
                            onClick={() => setNewStance('agree')}>👍 同意</button>
                        <button type="button" className={`stance-btn ${newStance === 'disagree' ? 'active' : ''}`}
                            onClick={() => setNewStance('disagree')}>👎 反對</button>
                    </div>
                    <textarea
                        value={newContent} onChange={e => setNewContent(e.target.value)}
                        placeholder="發表你的看法..." rows={3}
                    />
                    <button className="pixel-btn primary" type="submit" disabled={sending || !newContent.trim()}>
                        {sending ? '發送中...' : '發送'}
                    </button>
                </form>
            </div>
        </div>
    );
}
