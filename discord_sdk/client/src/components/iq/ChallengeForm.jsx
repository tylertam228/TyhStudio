import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function ChallengeForm({ userId, onBack }) {
    const [users, setUsers] = useState([]);
    const [targetId, setTargetId] = useState('');
    const [rankChange, setRankChange] = useState('');
    const [reason, setReason] = useState('');
    const [baseline, setBaseline] = useState(null);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers() {
        try {
            const data = await api.getRank();
            setUsers(data.filter(u => u.id !== userId));
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    }

    async function handleTargetChange(id) {
        setTargetId(id);
        if (id) {
            try {
                const bl = await api.getBaseline(id);
                setBaseline(bl);
            } catch { setBaseline(null); }
        } else {
            setBaseline(null);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!targetId || !rankChange || !reason) return;
        setSubmitting(true);
        setMessage('');

        try {
            await api.createChallenge({ targetId, rankChange: parseInt(rankChange), reason });
            setMessage('✅ 挑戰已提交！');
            setTimeout(onBack, 1500);
        } catch (err) {
            setMessage(`❌ ${err.message}`);
        }
        setSubmitting(false);
    }

    return (
        <div className="challenge-form">
            <button className="pixel-btn back-btn" onClick={onBack}>← 返回</button>
            <h2 className="section-title">發起排名挑戰</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>被挑戰者</label>
                    <select value={targetId} onChange={e => handleTargetChange(e.target.value)} required>
                        <option value="">選擇用戶</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.username} (目前排名: {u.currentRank ?? '無'})
                            </option>
                        ))}
                    </select>
                </div>

                {baseline && (
                    <div className="baseline-info">
                        季度基準排名：第 {baseline.baselineRank} 名 ({baseline.quarter})
                    </div>
                )}

                <div className="form-group">
                    <label>排名變動（正數=升，負數=降）</label>
                    <input
                        type="number" value={rankChange}
                        onChange={e => setRankChange(e.target.value)}
                        placeholder="例：2 或 -3"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>理由</label>
                    <textarea
                        value={reason} onChange={e => setReason(e.target.value)}
                        placeholder="說明為什麼要調整排名..."
                        rows={4} required
                    />
                </div>

                <button className="pixel-btn primary" type="submit" disabled={submitting}>
                    {submitting ? '提交中...' : '提交挑戰'}
                </button>
            </form>

            {message && <p className="form-message">{message}</p>}
        </div>
    );
}
