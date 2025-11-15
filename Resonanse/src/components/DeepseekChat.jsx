import { useState } from 'react';
import { useDeepseek } from '../hooks/useDeepseek';
import { DEEPSEEK_CONFIG } from '../config/deepseek';
import './DeepseekChat.css';

/**
 * DeepseekChat Component
 * 
 * A simple chat interface for interacting with Deepseek AI models
 */
function DeepseekChat() {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEEPSEEK_CONFIG.models.CHAT);
  const { chat, loading, error, response } = useDeepseek();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await chat(message, { model: selectedModel });
      setMessage('');
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  return (
    <div className="deepseek-chat">
      <h2>Deepseek AI Chat</h2>
      
      <div className="model-selector">
        <label htmlFor="model">Select Model:</label>
        <select 
          id="model"
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={loading}
        >
          <option value={DEEPSEEK_CONFIG.models.CHAT}>Deepseek Chat</option>
          <option value={DEEPSEEK_CONFIG.models.CODER}>Deepseek Coder</option>
          <option value={DEEPSEEK_CONFIG.models.REASONER}>Deepseek Reasoner</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={loading}
          rows={4}
        />
        <button type="submit" disabled={loading || !message.trim()}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="response-container">
          <h3>Response:</h3>
          <div className="response-content">
            {response.choices?.[0]?.message?.content || 'No response content'}
          </div>
          <div className="response-meta">
            <small>
              Model: {response.model} | 
              Tokens: {response.usage?.total_tokens || 'N/A'}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeepseekChat;
