import { useState } from 'react';
import { DEEPSEEK_CONFIG, getApiKey } from '../config/deepseek';

/**
 * Custom React hook for interacting with Deepseek AI models
 * 
 * @returns {Object} Hook utilities and state
 */
export const useDeepseek = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  /**
   * Send a chat completion request to Deepseek API
   * 
   * @param {string} message - The user message to send
   * @param {Object} options - Optional configuration
   * @returns {Promise<Object>} The API response
   */
  const chat = async (message, options = {}) => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      const error = new Error('Deepseek API key not found. Please set VITE_DEEPSEEK_API_KEY in your .env file');
      setError(error.message);
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        model: options.model || DEEPSEEK_CONFIG.models.CHAT,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        temperature: options.temperature || DEEPSEEK_CONFIG.defaults.temperature,
        max_tokens: options.maxTokens || DEEPSEEK_CONFIG.defaults.maxTokens,
        top_p: options.topP || DEEPSEEK_CONFIG.defaults.topP,
        frequency_penalty: options.frequencyPenalty || DEEPSEEK_CONFIG.defaults.frequencyPenalty,
        presence_penalty: options.presencePenalty || DEEPSEEK_CONFIG.defaults.presencePenalty,
        stream: false
      };

      const response = await fetch(`${DEEPSEEK_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setResponse(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset the hook state
   */
  const reset = () => {
    setLoading(false);
    setError(null);
    setResponse(null);
  };

  return {
    chat,
    loading,
    error,
    response,
    reset
  };
};
