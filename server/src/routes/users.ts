import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insertUser, listUsers, getUser, grantAccess, revokeAccess, listAccessibleCameraIdsForUser, updateCamera, getCamera, listUsersWithAccessForCamera } from '../db';

export const userRouter = Router();

// Simple header-based auth middleware: x-user-id selects acting user
userRouter.use(async (req, res, next) => {
	const userId = (req.headers['x-user-id'] as string) || '';
	if (!userId) return next();
	const user = await getUser(userId);
	(req as any).user = user || null;
	next();
});

// Create user (admin only if caller is admin; if no users exist, allow bootstrapping)
userRouter.post('/', async (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	const existing = await listUsers();
	if (existing.length > 0 && (!caller || caller.role !== 'admin')) {
		return res.status(403).json({ error: 'forbidden' });
	}
	const { name, role } = req.body as { name: string; role: 'admin' | 'user' };
	if (!name || (role !== 'admin' && role !== 'user')) return res.status(400).json({ error: 'invalid' });
	const id = uuidv4();
	await insertUser({ id, name, role, createdAt: new Date().toISOString() });
	res.status(201).json({ id, name, role });
});

// Current user
userRouter.get('/me', (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    res.json(user);
});

// List users (admin only)
userRouter.get('/', async (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const rows = await listUsers();
	res.json(rows);
});

// Grant camera access (admin only)
userRouter.post('/:userId/access/:cameraId', async (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { userId, cameraId } = req.params;
	if (!await getUser(userId)) return res.status(404).json({ error: 'user not found' });
	if (!await getCamera(cameraId)) return res.status(404).json({ error: 'camera not found' });
	await grantAccess(userId, cameraId);
	res.status(204).end();
});

// Revoke camera access (admin only)
userRouter.delete('/:userId/access/:cameraId', async (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { userId, cameraId } = req.params;
	await revokeAccess(userId, cameraId);
	res.status(204).end();
});

// List camera IDs current user can access
userRouter.get('/me/cameras', async (req, res) => {
	const caller = (req as any).user as { id?: string; role?: string } | null;
	if (!caller) return res.status(401).json({ error: 'unauthorized' });
	if (caller.role === 'admin') return res.json({ cameraIds: 'ALL' });
	const cameraIds = await listAccessibleCameraIdsForUser(caller.id!);
	res.json({ cameraIds });
});

// Admin can update camera name/rtsp
userRouter.put('/cameras/:id', async (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { id } = req.params;
	const cam = await getCamera(id);
	if (!cam) return res.status(404).json({ error: 'not found' });
	const { name, rtsp } = req.body as { name: string; rtsp: string };
	if (!name || !rtsp) return res.status(400).json({ error: 'invalid' });
	await updateCamera(id, name, rtsp);
	const updated = await getCamera(id);
	res.json(updated);
});

// List users who have access to a camera (admin only)
userRouter.get('/cameras/:cameraId/users', async (req, res) => {
	const caller = (req as any).user as { role?: string } | null;
	if (!caller || caller.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const { cameraId } = req.params;
	if (!await getCamera(cameraId)) return res.status(404).json({ error: 'camera not found' });
	const rows = await listUsersWithAccessForCamera(cameraId);
	res.json(rows);
});
