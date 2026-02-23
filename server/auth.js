import jwt from 'jsonwebtoken';

let cachedKeys = null;
let cacheExpiry = 0;

async function fetchPublicKeys() {
    if (cachedKeys && Date.now() < cacheExpiry) return cachedKeys;
    const res = await fetch(
        'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAge = cacheControl.match(/max-age=(\d+)/);
    cacheExpiry = Date.now() + (parseInt(maxAge?.[1] || '3600') * 1000);
    cachedKeys = await res.json();
    return cachedKeys;
}

export async function verifyAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token tidak ditemukan' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded) return res.status(401).json({ error: 'Token tidak valid' });

        const keys = await fetchPublicKeys();
        const key = keys[decoded.header.kid];
        if (!key) return res.status(401).json({ error: 'Key ID tidak ditemukan' });

        const projectId = process.env.FIREBASE_PROJECT_ID;
        const verified = jwt.verify(token, key, {
            algorithms: ['RS256'],
            audience: projectId,
            issuer: `https://securetoken.google.com/${projectId}`,
        });

        req.user = {
            uid: verified.sub || verified.user_id,
            email: verified.email || '',
            name: verified.name || '',
        };

        // Store ID dari header, default ke UID user sendiri
        req.storeId = req.headers['x-store-id'] || req.user.uid;

        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        return res.status(401).json({ error: 'Autentikasi gagal: ' + err.message });
    }
}
