const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { authPayloadSchema } = require('../validator/auth-schema');
const { profileUpdateSchema } = require('../validator/profile-schema');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, me, updateProfile } = require('../controller/auth');

/**
 * @openapi
 * components:
 *   schemas:
 *     AuthPayload:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         refreshToken:
 *           type: string
 *         userId:
 *           type: string
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         timezone:
 *           type: string
 *         preferred_time:
 *           type: string
 *           enum: [morning, afternoon, evening]
 *         weekly_target_hours:
 *           type: number
 *         availability:
 *           type: object
 *         llm_token_count:
 *           type: number
 *     ProfileUpdate:
 *       type: object
 *       properties:
 *         timezone:
 *           type: string
 *         preferred_time:
 *           type: string
 *           enum: [morning, afternoon, evening]
 *         weekly_target_hours:
 *           type: number
 *           minimum: 1
 *           maximum: 168
 *         availability:
 *           type: object
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthPayload'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/register', authLimiter, validate(authPayloadSchema), register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthPayload'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/login', authLimiter, validate(authPayloadSchema), login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, me);

/**
 * @openapi
 * /api/auth/me:
 *   patch:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdate'
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/me', authenticate, validate(profileUpdateSchema), updateProfile);

module.exports = router;
