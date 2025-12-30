import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', (_req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/register', (_req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

export default router;
