const BASE = '/api/iq';

let accessToken = null;

export function setAccessToken(token) {
    accessToken = token;
}

async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
}

export const api = {
    getMe: () => request('/me'),
    sendWhitelistRequest: (selfIntro) => request('/whitelist-request', { method: 'POST', body: JSON.stringify({ selfIntro }) }),
    getVoteStatus: () => request('/vote/status'),
    submitVote: (rankedOrder) => request('/vote/submit', { method: 'POST', body: JSON.stringify({ rankedOrder }) }),
    getResults: (month) => request(`/results/${month}`),
    getHistory: () => request('/history'),
    getRank: () => request('/rank'),
    getChallenges: () => request('/challenges'),
    createChallenge: (data) => request('/challenges', { method: 'POST', body: JSON.stringify(data) }),
    voteChallenge: (id, vote) => request(`/challenges/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote }) }),
    withdrawChallenge: (id) => request(`/challenges/${id}/withdraw`, { method: 'POST' }),
    getComments: (id) => request(`/challenges/${id}/comments`),
    addComment: (id, stance, content) => request(`/challenges/${id}/comments`, { method: 'POST', body: JSON.stringify({ stance, content }) }),
    getBaseline: (userId) => request(`/baseline/${userId}`),
    getProjects: () => request('/projects'),
    createProject: (data) => request('/admin/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id, data) => request(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProject: (id) => request(`/admin/projects/${id}`, { method: 'DELETE' }),
    getWhitelist: () => request('/admin/whitelist'),
    addWhitelist: (userId, username) => request('/admin/whitelist', { method: 'POST', body: JSON.stringify({ userId, username }) }),
    removeWhitelist: (userId) => request(`/admin/whitelist/${userId}`, { method: 'DELETE' }),
};
