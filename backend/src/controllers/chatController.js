const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const chatbotService = require('../services/chatbotService');

const chat = asyncHandler(async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'sessionId and message are required' });
  }

  const response = await chatbotService.generateChatResponse(sessionId, message);
  res.status(StatusCodes.OK).json(response);
});

const getHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const history = await chatbotService.getChatHistory(sessionId);
  res.status(StatusCodes.OK).json(history);
});

const clearHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  await chatbotService.deleteChatHistory(sessionId);
  res.status(StatusCodes.OK).json({ message: 'History cleared' });
});

module.exports = {
  chat,
  getHistory,
  clearHistory
};
