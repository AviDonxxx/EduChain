# React + Vite + Deepseek AI

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules. It now includes integration with Deepseek AI models for chat and completion features.

## Deepseek Integration

This project includes a full integration with [Deepseek AI](https://platform.deepseek.com/), providing access to powerful language models including:

- **Deepseek Chat** - General purpose conversational AI
- **Deepseek Coder** - Specialized for code generation and analysis
- **Deepseek Reasoner** - Advanced reasoning and problem-solving

### Setup

1. Get your API key from [Deepseek Platform](https://platform.deepseek.com/)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Add your API key to `.env`:
   ```
   VITE_DEEPSEEK_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Features

- **DeepseekChat Component** - Interactive chat interface
- **useDeepseek Hook** - Reusable React hook for API integration
- **Model Selection** - Switch between different Deepseek models
- **Error Handling** - Comprehensive error states and loading indicators
- **Configurable** - Easy to customize parameters (temperature, tokens, etc.)

### Project Structure

```
src/
├── components/
│   ├── DeepseekChat.jsx    # Chat UI component
│   └── DeepseekChat.css    # Styling
├── hooks/
│   └── useDeepseek.js      # API integration hook
└── config/
    └── deepseek.js         # Configuration and constants
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Vite Plugins

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
