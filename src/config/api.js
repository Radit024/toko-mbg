import { auth } from './firebase';

const API_BASE = '/api';

async function getToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('Belum login');
    return user.getIdToken();
}

async function request(method, path, body = null, storeId = null) {
    const token = await getToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    if (storeId) headers['X-Store-Id'] = storeId;

    const options = { method, headers };
    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${path}`, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request gagal');
    }
    if (res.status === 204) return null;
    return res.json();
}

export const api = {
    get: (path, storeId) => request('GET', path, null, storeId),
    post: (path, body, storeId) => request('POST', path, body, storeId),
    put: (path, body, storeId) => request('PUT', path, body, storeId),
    del: (path, storeId) => request('DELETE', path, null, storeId),
};
