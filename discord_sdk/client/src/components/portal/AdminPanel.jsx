import { useState } from 'react';
import { api } from '../../utils/api';

export default function AdminPanel({ onRefresh }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [message, setMessage] = useState('');

    async function handleAdd(e) {
        e.preventDefault();
        if (!title || !url) return;

        try {
            await api.createProject({ title, description, url, imageUrl: imageUrl || null });
            setTitle('');
            setDescription('');
            setUrl('');
            setImageUrl('');
            setMessage('專案已新增');
            onRefresh();
        } catch (err) {
            setMessage(`錯誤: ${err.message}`);
        }
    }

    return (
        <div className="admin-panel">
            <h3>新增專案</h3>
            <form onSubmit={handleAdd} className="admin-form">
                <input
                    type="text" placeholder="標題 *" value={title}
                    onChange={e => setTitle(e.target.value)} required
                />
                <input
                    type="text" placeholder="描述" value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                <input
                    type="url" placeholder="網址 *" value={url}
                    onChange={e => setUrl(e.target.value)} required
                />
                <input
                    type="url" placeholder="圖片網址" value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                />
                <button type="submit" className="pixel-btn primary">新增</button>
            </form>
            {message && <p className="admin-message">{message}</p>}
        </div>
    );
}
