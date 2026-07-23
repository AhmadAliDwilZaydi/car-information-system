const express = require('express');
const { body } = require("express-validator");
const chatController = require('../controllers/chatController');
const validateRequest = require("../middleware/validate");
const { chatRateLimit } = require("../middleware/chatRateLimit");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chatbot AI
 *   description: Chatbot AI berbasis Ollama dengan RAG (Retrieval-Augmented Generation) dari database mobil
 */

/**
 * @swagger
 * /chat:
 *   post:
 *     tags: [Chatbot AI]
 *     security: []
 *     summary: Kirim pesan ke AI Chatbot
 *     description: |
 *       Menerima pesan pengguna, mencari data mobil relevan di MongoDB (RAG),
 *       menyisipkan konteks ke Ollama LLM, dan mengembalikan jawaban berbasis data nyata.
 *       Riwayat percakapan disimpan ke collection ChatHistory.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, message]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "abc123xyz456"
 *                 description: ID sesi percakapan (dibuat oleh frontend, bisa disimpan di localStorage)
 *               message:
 *                 type: string
 *                 example: "Rekomendasikan MPV diesel di bawah 300 juta"
 *                 description: Pesan/pertanyaan pengguna
 *     responses:
 *       200:
 *         description: Jawaban berhasil dari Ollama
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Teks jawaban dari AI
 *                 referencedCars:
 *                   type: array
 *                   description: Daftar mobil yang dijadikan konteks RAG
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *       500:
 *         description: Gagal terhubung ke Ollama server
 */
router.post('/', chatRateLimit, [body("sessionId").trim().isLength({ min: 8, max: 128 }), body("message").trim().isLength({ min: 1, max: 2000 })], validateRequest, chatController.chat);

/**
 * @swagger
 * /chat/history/{sessionId}:
 *   get:
 *     tags: [Chatbot AI]
 *     security: []
 *     summary: Ambil riwayat percakapan satu sesi
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *         description: ID sesi percakapan
 *     responses:
 *       200:
 *         description: Riwayat percakapan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   sessionId: { type: string }
 *                   role: { type: string, enum: [user, assistant] }
 *                   message: { type: string }
 *                   referencedCarIds:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Car'
 *                   createdAt: { type: string, format: date-time }
 */
router.get('/history/:sessionId', chatController.getHistory);

/**
 * @swagger
 * /chat/history/{sessionId}:
 *   delete:
 *     tags: [Chatbot AI]
 *     security: []
 *     summary: Hapus seluruh riwayat percakapan satu sesi
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Riwayat berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat history cleared
 */
router.delete('/history/:sessionId', chatController.clearHistory);

module.exports = router;
