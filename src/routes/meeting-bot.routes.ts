import { Router } from 'express';
import { meetingBotController } from '../controllers/meeting-bot.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/meetings/{id}/bot/deploy:
 *   post:
 *     summary: Deploy bot to meeting
 *     tags: [Meeting Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               botName:
 *                 type: string
 *               recordAudio:
 *                 type: boolean
 *               recordVideo:
 *                 type: boolean
 *               recordTranscription:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Bot deployed successfully
 */
router.post('/:id/bot/deploy', meetingBotController.deployBot);

/**
 * @swagger
 * /api/meetings/{id}/bot/sync:
 *   post:
 *     summary: Sync bot status with meeting
 *     tags: [Meeting Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bot status synced
 */
router.post('/:id/bot/sync', meetingBotController.syncBotStatus);

/**
 * @swagger
 * /api/meetings/{id}/recording:
 *   get:
 *     summary: Get meeting recording
 *     tags: [Meeting Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recording URLs
 */
router.get('/:id/recording', meetingBotController.getRecording);

/**
 * @swagger
 * /api/meetings/{id}/transcription:
 *   get:
 *     summary: Get meeting transcription
 *     tags: [Meeting Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transcription data
 */
router.get('/:id/transcription', meetingBotController.getTranscription);

/**
 * @swagger
 * /api/bots/{botId}/status:
 *   get:
 *     summary: Get bot status
 *     tags: [Meeting Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bot status
 */
router.get('/bots/:botId/status', meetingBotController.getBotStatus);

/**
 * @swagger
 * /api/bots/{botId}/stop:
 *   post:
 *     summary: Stop bot
 *     tags: [Meeting Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Bot stopped
 */
router.post('/bots/:botId/stop', meetingBotController.stopBot);

export default router;
