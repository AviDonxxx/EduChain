# Deepseek AI Integration Guide

## Overview

This document provides detailed information about the Deepseek AI integration in this React application.

## What is Deepseek?

Deepseek is a powerful AI model provider offering state-of-the-art language models for various tasks:

- **Chat**: Natural language conversations
- **Code**: Programming assistance and code generation
- **Reasoning**: Complex problem-solving and analytical tasks

## Architecture

### Configuration Layer (`src/config/deepseek.js`)

Centralizes all Deepseek-related configuration:

```javascript
import { DEEPSEEK_CONFIG, getApiKey } from './config/deepseek';
```

**Available Models:**
- `deepseek-chat` - General purpose conversational model
- `deepseek-coder` - Specialized for programming tasks
- `deepseek-reasoner` - Advanced reasoning capabilities

**Configurable Parameters:**
- `temperature` (0-2): Controls randomness (default: 0.7)
- `maxTokens`: Maximum response length (default: 2000)
- `topP`: Nucleus sampling parameter (default: 0.95)
- `frequencyPenalty`: Reduces repetition (default: 0)
- `presencePenalty`: Encourages topic diversity (default: 0)

### Hook Layer (`src/hooks/useDeepseek.js`)

A custom React hook that encapsulates API interaction logic:

```javascript
const { chat, loading, error, response, reset } = useDeepseek();
```

**Returns:**
- `chat(message, options)` - Send a message to the API
- `loading` - Boolean indicating request in progress
- `error` - Error message if request fails
- `response` - Full API response object
- `reset()` - Clear all state

**Usage Example:**

```javascript
const MyComponent = () => {
  const { chat, loading, error, response } = useDeepseek();

  const sendMessage = async () => {
    try {
      const result = await chat('Hello, Deepseek!', {
        model: 'deepseek-chat',
        temperature: 0.8
      });
      console.log(result.choices[0].message.content);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <button onClick={sendMessage} disabled={loading}>
        Send
      </button>
      {error && <p>Error: {error}</p>}
      {response && <p>{response.choices[0].message.content}</p>}
    </div>
  );
};
```

### Component Layer (`src/components/DeepseekChat.jsx`)

A ready-to-use chat interface component:

```javascript
import DeepseekChat from './components/DeepseekChat';

function App() {
  return <DeepseekChat />;
}
```

**Features:**
- Model selection dropdown
- Text input area
- Loading states
- Error handling
- Response display with metadata

## API Response Structure

```javascript
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "deepseek-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response text here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## Environment Variables

Create a `.env` file in the project root:

```bash
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- Never commit `.env` to version control
- Use `.env.example` as a template
- The `VITE_` prefix is required for Vite to expose the variable

## Error Handling

The integration includes comprehensive error handling:

1. **Missing API Key**: Clear error message when key is not configured
2. **Network Errors**: Handles connection issues gracefully
3. **API Errors**: Displays server-side error messages
4. **Validation**: Prevents empty message submission

## Security Considerations

1. **API Key Protection**: 
   - Never expose your API key in client-side code
   - For production, use a backend proxy to secure the key
   
2. **Rate Limiting**:
   - Implement client-side rate limiting for production use
   - Consider caching responses when appropriate

3. **Input Validation**:
   - Sanitize user input before sending to the API
   - Implement content moderation if needed

## Customization

### Changing Default Parameters

Edit `src/config/deepseek.js`:

```javascript
export const DEEPSEEK_CONFIG = {
  defaults: {
    temperature: 0.5,    // More deterministic
    maxTokens: 1000,     // Shorter responses
    topP: 0.9,
    // ... other parameters
  }
};
```

### Adding Conversation History

Modify the `chat` function in `useDeepseek.js`:

```javascript
const chat = async (messages, options = {}) => {
  const requestBody = {
    model: options.model || DEEPSEEK_CONFIG.models.CHAT,
    messages: messages,  // Array of {role, content} objects
    // ... other parameters
  };
  // ... rest of the implementation
};
```

### Implementing Streaming Responses

For real-time streaming:

```javascript
const requestBody = {
  // ... other parameters
  stream: true
};

const response = await fetch(url, options);
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Process chunk...
}
```

## Performance Tips

1. **Debounce Requests**: Prevent excessive API calls
2. **Caching**: Store responses for repeated queries
3. **Lazy Loading**: Load the chat component only when needed
4. **Token Optimization**: Use appropriate `maxTokens` values

## Troubleshooting

### "API key not found" error
- Ensure `.env` file exists in project root
- Verify `VITE_` prefix is present
- Restart the development server after adding the key

### CORS errors
- Deepseek API should support CORS for browser requests
- If issues persist, implement a backend proxy

### Slow responses
- Check network connection
- Consider reducing `maxTokens`
- Verify API service status

## Resources

- [Deepseek Platform](https://platform.deepseek.com/)
- [API Documentation](https://platform.deepseek.com/api-docs/)
- [Model Comparison](https://platform.deepseek.com/docs/models)

## Support

For issues specific to this integration, please open an issue in the repository.
For Deepseek API issues, contact Deepseek support.
