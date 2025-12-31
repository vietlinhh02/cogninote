import { Router } from 'express';
import { meetingController } from '../controllers/meeting.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all meeting routes
router.use(authenticate);

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: Get all meetings
 *     tags: [Meetings]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by meeting status
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: Filter by meeting platform (Zoom, Teams, etc.)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter meetings scheduled after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter meetings scheduled before this date
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of records to skip
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *         description: Number of records to take
 *     responses:
 *       200:
 *         description: List of meetings
 */
router.get('/', meetingController.getMeetings);

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               meetingUrl:
 *                 type: string
 *               platform:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting created successfully
 */
router.post('/', meetingController.createMeeting);

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Get meeting by ID
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: withTranscriptions
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: withAnalysis
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: withRelations
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Meeting details
 *       404:
 *         description: Meeting not found
 */
router.get('/:id', meetingController.getMeetingById);

/**
 * @swagger
 * /api/meetings/{id}:
 *   put:
 *     summary: Update meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               meetingUrl:
 *                 type: string
 *               platform:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *       404:
 *         description: Meeting not found
 */
router.put('/:id', meetingController.updateMeeting);

/**
 * @swagger
 * /api/meetings/{id}:
 *   delete:
 *     summary: Delete meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Meeting deleted successfully
 *       404:
 *         description: Meeting not found
 */
router.delete('/:id', meetingController.deleteMeeting);

/**
 * @swagger
 * /api/meetings/{id}/start:
 *   post:
 *     summary: Start meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting started
 */
router.post('/:id/start', meetingController.startMeeting);

/**
 * @swagger
 * /api/meetings/{id}/pause:
 *   post:
 *     summary: Pause meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting paused
 */
router.post('/:id/pause', meetingController.pauseMeeting);

/**
 * @swagger
 * /api/meetings/{id}/resume:
 *   post:
 *     summary: Resume meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting resumed
 */
router.post('/:id/resume', meetingController.resumeMeeting);

/**
 * @swagger
 * /api/meetings/{id}/end:
 *   post:
 *     summary: End meeting
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meeting ended
 */
router.post('/:id/end', meetingController.endMeeting);

/**
 * @swagger
 * /api/meetings/{id}/export:
 *   get:
 *     summary: Export meeting data
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, txt, csv, md]
 *         description: Export format (default json)
 *     responses:
 *       200:
 *         description: Exported data
 */
router.get('/:id/export', meetingController.exportMeeting);

export default router;
