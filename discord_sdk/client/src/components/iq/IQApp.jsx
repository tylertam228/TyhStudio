import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import VotingPanel from './VotingPanel';
import RankBoard from './RankBoard';
import ChallengeList from './ChallengeList';
import HistoryChart from './HistoryChart';

const TABS = [
    { id: 'rank', label: '📊 排名', icon: '📊' },
    { id: 'vote', label: '🗳️ 投票', icon: '🗳️' },
    { id: 'challenges', label: '⚔️ 挑戰', icon: '⚔️' },
    { id: 'history', label: '📈 歷史', icon: '📈' },
];

export default function IQApp({ userId, onBack }) {
    const [activeTab, setActiveTab] = useState('rank');
    const [whitelisted, setWhitelisted] = useState(null);
    const [selfIntro, setSelfIntro] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        checkAccess();
    }, []);

    async function checkAccess() {
        try {
            const data = await api.getMe();
            setWhitelisted(data.whitelisted);
        } catch {
            setWhitelisted(false);
        }
    }

    async function handleSendRequest() {
        if (!selfIntro.trim()) return;
        setSending(true);
        try {
            await api.sendWhitelistRequest(selfIntro.trim());
            setRequestSent(true);
        } catch {
            setRequestSent(true);
        }
        setSending(false);
    }

    if (whitelisted === null) {
        return (
            <div className="iq-loading">
                <div className="loading-logo">🧠</div>
                <p>載入中...</p>
            </div>
        );
    }

    if (!whitelisted) {
        return (
            <div className="iq-blocked">
                <div className="blocked-icon">🔒</div>
                <h2>尚未獲得權限</h2>
                {requestSent ? (
                    <p>✅ 已向管理員發送申請通知，請耐心等待審核。</p>
                ) : (
                    <>
                        <p>你不在白名單中，請告訴管理員你是誰：</p>
                        <div className="whitelist-request-form">
                            <textarea
                                className="intro-input"
                                placeholder="請簡短介紹你自己，例如：我是 XXX 群的 OOO"
                                value={selfIntro}
                                onChange={e => setSelfIntro(e.target.value)}
                                maxLength={200}
                                rows={3}
                            />
                            <button
                                className="pixel-btn primary"
                                onClick={handleSendRequest}
                                disabled={!selfIntro.trim() || sending}
                            >
                                {sending ? '送出中...' : '📨 送出申請'}
                            </button>
                        </div>
                    </>
                )}
                <button className="pixel-btn" onClick={onBack} style={{ marginTop: '16px' }}>返回</button>
            </div>
        );
    }

    return (
        <div className="iq-app">
            <header className="iq-header">
                <button className="pixel-btn back-btn" onClick={onBack}>← 返回</button>
                <h1 className="iq-title">🧠 IQ 排名系統</h1>
            </header>

            <nav className="iq-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <main className="iq-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'rank' && <RankBoard userId={userId} />}
                        {activeTab === 'vote' && <VotingPanel userId={userId} />}
                        {activeTab === 'challenges' && <ChallengeList userId={userId} />}
                        {activeTab === 'history' && <HistoryChart userId={userId} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
