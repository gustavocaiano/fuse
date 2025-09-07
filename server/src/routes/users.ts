import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insertUser, listUsersStmt, getUserStmt, grantAccessStmt, revokeAccessStmt, listAccessibleCameraIdsForUserStmt, updateCameraStmt, getCameraStmt, listUsersWithAccessForCameraStmt } from '../db';

export const userRouter = Router();

// Simple header-based auth middleware: x-user-id selects acting user
userRouter.use((req, res, next) => {
	const userId = (req.headers['x-user-id'] as string) || '';
	if (!userId) return next();
	const user = getUserStmt.get(userId) as any;
	(req as any).user = user || null;
	next();
});

// Create user (admin only if caller is admin; if no users exist, allow bootstrapping)
userRouter.post('/', (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	const existing = listUsersStmt.all() as any[];
	if (existing.length > 0 && (!caller || caller.role !== 'admin')) {
		return res.status(403).json({ error: 'forbidden' });
	}
	const { name, role } = req.body as { name: string; role: 'admin' | 'user' };
	if (!name || (role !== 'admin' && role !== 'user')) return res.status(400).json({ error: 'invalid' });
	const id = uuidv4();
	insertUser.run({ id, name, role, createdAt: new Date().toISOString() });
	res.status(201).json({ id, name, role });
});

// Current user
userRouter.get('/me', (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    res.json(user);
});

// List users (admin only)
userRouter.get('/', (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const rows = listUsersStmt.all();
	res.json(rows);
});

// Grant camera access (admin only)
userRouter.post('/:userId/access/:cameraId', (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { userId, cameraId } = req.params;
	if (!getUserStmt.get(userId)) return res.status(404).json({ error: 'user not found' });
	if (!getCameraStmt.get(cameraId)) return res.status(404).json({ error: 'camera not found' });
	grantAccessStmt.run(userId, cameraId);
	res.status(204).end();
});

// Revoke camera access (admin only)
userRouter.delete('/:userId/access/:cameraId', (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { userId, cameraId } = req.params;
	revokeAccessStmt.run(userId, cameraId);
	res.status(204).end();
});

// List camera IDs current user can access
userRouter.get('/me/cameras', (req, res) => {
	const caller = (req as any).user as { id?: string; role?: string } | null;
	if (!caller) return res.status(401).json({ error: 'unauthorized' });
	if (caller.role === 'admin') return res.json({ cameraIds: 'ALL' });
	const rows = listAccessibleCameraIdsForUserStmt.all(caller.id) as Array<{ cameraId: string }>;
	res.json({ cameraIds: rows.map(r => r.cameraId) });
});

// Admin can update camera name/rtsp
userRouter.put('/cameras/:id', (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { id } = req.params;
	const cam = getCameraStmt.get(id) as any;
	if (!cam) return res.status(404).json({ error: 'not found' });
	const { name, rtsp } = req.body as { name: string; rtsp: string };
	if (!name || !rtsp) return res.status(400).json({ error: 'invalid' });
	updateCameraStmt.run({ id, name, rtsp });
	const updated = getCameraStmt.get(id);
	res.json(updated);
});

// List users who have access to a camera (admin only)
userRouter.get('/cameras/:cameraId/users', (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { cameraId } = req.params;
	if (!getCameraStmt.get(cameraId)) return res.status(404).json({ error: 'camera not found' });
	const rows = listUsersWithAccessForCameraStmt.all(cameraId) as any[];
	res.json(rows);
});
