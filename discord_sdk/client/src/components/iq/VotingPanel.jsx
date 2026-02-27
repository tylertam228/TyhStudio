import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../../utils/api';

function SortableItem({ id, username, index }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}
            className={`sortable-item ${isDragging ? 'dragging' : ''}`}
        >
            <span className="sort-rank">{index + 1}</span>
            <span className="sort-handle">☰</span>
            <span className="sort-name">{username}</span>
            {index === 0 && <span className="sort-label top">最高</span>}
        </div>
    );
}

export default function VotingPanel({ userId }) {
    const [status, setStatus] = useState(null);
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    useEffect(() => {
        loadStatus();
    }, []);

    async function loadStatus() {
        try {
            const data = await api.getVoteStatus();
            setStatus(data);
            if (data.myRankedOrder) {
                const orderedUsers = data.myRankedOrder.map(id =>
                    data.users.find(u => u.id === id) || { id, username: id }
                );
                setItems(orderedUsers);
            } else {
                setItems(data.users);
            }
        } catch (err) {
            setMessage(`錯誤: ${err.message}`);
        }
        setLoading(false);
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setItems(prev => {
            const oldIndex = prev.findIndex(i => i.id === active.id);
            const newIndex = prev.findIndex(i => i.id === over.id);
            return arrayMove(prev, oldIndex, newIndex);
        });
    }

    async function handleSubmit() {
        setSubmitting(true);
        setMessage('');
        try {
            const rankedOrder = items.map(i => i.id);
            await api.submitVote(rankedOrder);
            setMessage('✅ 投票已提交！');
            await loadStatus();
        } catch (err) {
            setMessage(`❌ ${err.message}`);
        }
        setSubmitting(false);
    }

    if (loading) return <div className="iq-loading"><p>載入投票狀態...</p></div>;

    if (!status?.isOpen) {
        return (
            <div className="vote-closed">
                <div className="closed-icon">🔒</div>
                <h2>投票尚未開放</h2>
                <p>每月 1 日 09:00 開放投票，第 6 日 09:00 結束。</p>
                {status?.hasVoted && <p className="voted-tag">✅ 你已完成本月投票</p>}
            </div>
        );
    }

    return (
        <div className="voting-panel">
            <h2 className="section-title">🗳️ {status.month} 投票</h2>
            <p className="vote-instructions">
                拖拉排序：由上到下為 IQ 最高到最低。
                {status.hasVoted && <span className="voted-badge">（已投票，可重新提交）</span>}
            </p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="sortable-list">
                        {items.map((item, index) => (
                            <SortableItem key={item.id} id={item.id} username={item.username} index={index} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <button
                className="pixel-btn primary submit-vote-btn"
                onClick={handleSubmit}
                disabled={submitting}
            >
                {submitting ? '提交中...' : '提交投票'}
            </button>

            {message && <p className="vote-message">{message}</p>}
        </div>
    );
}
