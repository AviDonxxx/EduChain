/**
 * Deepseek API Configuration
 * 
 * Deepseek is an AI model provider offering powerful language models
 * for chat, completion, and other AI tasks.
 * 
 * API Documentation: https://platform.deepseek.com/api-docs/
 */

export const DEEPSEEK_CONFIG = {
  // Base API endpoint
  baseURL: 'https://api.deepseek.com/v1',
  
  // Available models
  models: {
    CHAT: 'deepseek-chat',
    CODER: 'deepseek-coder',
    REASONER: 'deepseek-reasoner'
  },
  
  // Default parameters
  defaults: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.95,
    frequencyPenalty: 0,
    presencePenalty: 0
  }
};

/**
 * Get API key from environment variables
 * Users should set VITE_DEEPSEEK_API_KEY in their .env file
 */
export const getApiKey = () => {
  return import.meta.env.VITE_DEEPSEEK_API_KEY;
};
