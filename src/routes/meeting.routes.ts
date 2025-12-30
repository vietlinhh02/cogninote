import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: Get all meetings
 *     tags: [Meetings]
 *     responses:
 *       200:
 *         description: List of meetings
 */
router.get('/', (_req, res) => {
  res.json({ message: 'Get meetings endpoint - to be implemented' });
});

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     responses:
 *       201:
 *         description: Meeting created successfully
 */
router.post('/', (_req, res) => {
  res.json({ message: 'Create meeting endpoint - to be implemented' });
});

export default router;
