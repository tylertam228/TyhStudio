import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../utils/api';

export default function HistoryChart({ userId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadHistory(); }, []);

    async function loadHistory() {
        try {
            const data = await api.getHistory();
            const reversed = [...data].reverse().map(h => ({
                month: h.month,
                rank: h.finalRank,
            }));
            setHistory(reversed);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
        setLoading(false);
    }

    if (loading) return <div className="iq-loading"><p>載入歷史...</p></div>;

    if (history.length === 0) {
        return (
            <div className="history-empty">
                <div className="empty-icon">📈</div>
                <h2>尚無歷史資料</h2>
                <p>參與每月投票後會在這裡顯示排名走勢圖。</p>
            </div>
        );
    }

    const maxRank = Math.max(...history.map(h => h.rank));

    return (
        <div className="history-chart">
            <h2 className="section-title">📈 排名走勢</h2>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={history} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
                        <XAxis
                            dataKey="month" stroke="#8b8b8b"
                            tick={{ fontFamily: 'VT323', fontSize: 14 }}
                        />
                        <YAxis
                            reversed domain={[1, maxRank]}
                            stroke="#8b8b8b"
                            tick={{ fontFamily: 'VT323', fontSize: 14 }}
                            label={{ value: '排名', angle: -90, position: 'insideLeft', fill: '#8b8b8b' }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#1a1a2e',
                                border: '2px solid #00ff00',
                                fontFamily: 'VT323',
                                fontSize: 16,
                            }}
                            formatter={(value) => [`第 ${value} 名`, '排名']}
                        />
                        <Line
                            type="monotone" dataKey="rank" stroke="#00ff00"
                            strokeWidth={3} dot={{ fill: '#00ff00', r: 5 }}
                            activeDot={{ r: 8, fill: '#ffff00' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="history-table">
                <h3>歷史紀錄</h3>
                <div className="table-rows">
                    {[...history].reverse().map(h => (
                        <div key={h.month} className="table-row">
                            <span className="table-month">{h.month}</span>
                            <span className="table-rank">第 {h.rank} 名</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
