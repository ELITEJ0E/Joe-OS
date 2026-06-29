import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

// Manual CORS middleware (bypasses dependency issues cleanly)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  console.log('Google GenAI client initialized with API key.');
} else {
  console.warn('GEMINI_API_KEY not found in environment. Gemini features will require manual API key input or use Ollama only.');
}

// 128-dimensional local vector hashing helper (extremely robust, zero-dependency cosine similarity)
function getLocalEmbeddingVector(text: string): number[] {
  const dims = 128;
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length === 0) return vec;
  
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dims;
    vec[idx] += 1;
  }
  
  // Normalize vector (L2 norm)
  let sumSq = 0;
  for (let i = 0; i < dims; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < dims; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

const BRAIN_FILE = path.join(process.cwd(), 'brain.json');

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', geminiAvailable: !!ai });
});

app.get('/api/memory', (req, res) => {
  try {
    if (!fs.existsSync(BRAIN_FILE)) return res.json([]);
    const data = JSON.parse(fs.readFileSync(BRAIN_FILE, 'utf-8'));
    res.json(data);
  } catch { res.json([]); }
});

app.post('/api/memory', (req, res) => {
  try {
    const items = req.body.items;
    fs.writeFileSync(BRAIN_FILE, JSON.stringify(items, null, 2));
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Endpoint for generating embeddings (either Gemini or Local Vector)
app.post('/api/embeddings', async (req, res) => {
  const { text, engine } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text prompt is required' });
  }

  try {
    if (engine === 'gemini' && ai) {
      const response: any = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text,
      });
      const values = response.embedding?.values || response.embeddings?.[0]?.values || response.embeddings?.values;
      if (values) {
        return res.json({ embedding: values });
      }
    }
  } catch (error: any) {
    console.error('Error generating Gemini embedding, falling back to local hashing:', error.message);
  }

  // Fallback to local high-fidelity vector hashing
  const vector = getLocalEmbeddingVector(text);
  return res.json({ embedding: vector });
});

// Proxy Ollama tags endpoint to get installed models list
app.get('/api/tags', async (req, res) => {
  const ollamaUrl = (req.query.url as string) || 'http://localhost:11434';
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }
    const data = await response.json();
    return res.json({ models: data.models || [], raw: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Proxy Ollama pull endpoint to download new models
app.post('/api/pull', async (req, res) => {
  const { name, ollamaUrl = 'http://localhost:11434' } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Model name is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const controller = new AbortController();
    req.on('close', () => {
      controller.abort();
    });

    const response = await fetch(`${ollamaUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: true }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Ollama response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        res.write(`data: ${line}\n\n`);
      }
    }
    return res.end();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Client aborted pull request.');
      return res.end();
    }
    console.error('Error in pull proxy:', err);
    res.write(`data: ${JSON.stringify({ status: 'error', error: err.message })}\n\n`);
    return res.end();
  }
});

// Combined agent chat routing (SSE Stream & standard JSON support)
app.post('/api/chat', async (req, res) => {
  const {
    engine,
    model,
    messages,
    systemInstruction,
    stream = true,
    ollamaUrl = 'http://localhost:11434',
    enableSearch = false,
  } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages list is required' });
  }

  // Set headers for SSE Streaming if active
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  // Mode: Gemini Cloud Engine
  if (engine === 'gemini') {
    // If a custom cloud API key was provided, construct a temporary client, else use env injected client
    const targetKey = req.body.cloudApiKey || process.env.GEMINI_API_KEY;
    const targetClient = req.body.cloudApiKey ? new GoogleGenAI({ apiKey: targetKey }) : ai;
    
    if (!targetClient) {
      const errMsg = 'Gemini API client not initialized. Provide an API key in settings or backend env.';
      if (stream) {
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        return res.end();
      } else {
        return res.status(500).json({ error: errMsg });
      }
    }

    try {
      // Map Ollama / Generic models to correct Gemini models
      let mappedModel = 'gemini-2.5-flash';
      if (model?.toLowerCase().includes('coder') || model?.toLowerCase().includes('14b') || model?.toLowerCase().includes('pro')) {
        mappedModel = 'gemini-2.5-pro'; // Premium coder reasoning
      }

      // Convert messages to GoogleGenAI formats
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));

      const config: any = {
        systemInstruction,
      };

      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      if (stream) {
        const streamResponse = await targetClient.models.generateContentStream({
          model: mappedModel,
          contents,
          config,
        });

        for await (const chunk of streamResponse) {
          const text = chunk.text || '';
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        return res.end();
      } else {
        const response = await targetClient.models.generateContent({
          model: mappedModel,
          contents,
          config,
        });
        return res.json({ text: response.text });
      }
    } catch (error: any) {
      console.error('Gemini execution error:', error);
      const errMsg = error.message || 'Unknown error occurred during Gemini call';
      if (stream) {
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        return res.end();
      } else {
        return res.status(500).json({ error: errMsg });
      }
    }
  }
  
  // Mode: OpenAI compatible / OpenRouter
  if (engine === 'openai' || engine === 'openrouter') {
    try {
      const apiKey = req.body.cloudApiKey;
      if (!apiKey) {
        throw new Error(`API key is required for ${engine}`);
      }
      
      const baseUrl = engine === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      
      const formattedMessages = messages.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      }));
      if (systemInstruction) {
        formattedMessages.unshift({ role: 'system', content: systemInstruction });
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(engine === 'openrouter' ? { 'HTTP-Referer': 'https://joelos.ai', 'X-Title': 'JoelOS' } : {})
        },
        body: JSON.stringify({
          model: model || (engine === 'openai' ? 'gpt-4o' : 'qwen/qwen-2.5-coder-32b-instruct'),
          messages: formattedMessages,
          stream,
        })
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`API returned status ${response.status}: ${txt}`);
      }

      if (stream) {
        if (!response.body) throw new Error('Response body empty');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === 'data: [DONE]') continue;
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.substring(6));
                const text = parsed.choices?.[0]?.delta?.content || '';
                if (text) {
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              } catch (e) { }
            }
          }
        }
        return res.end();
      } else {
        const data = await response.json();
        return res.json({ text: data.choices?.[0]?.message?.content || '' });
      }

    } catch (error: any) {
      console.error(`${engine} execution error:`, error);
      const errMsg = error.message || `Unknown error during ${engine} call`;
      if (stream) {
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        return res.end();
      } else {
        return res.status(500).json({ error: errMsg });
      }
    }
  }

  // Mode: Local Ollama Proxy (bypasses browser CORS / Mixed Content issues)
  try {
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    if (systemInstruction) {
      // Add system instruction at the beginning or as system message
      formattedMessages.unshift({
        role: 'system',
        content: systemInstruction,
      });
    }

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama server returned status ${response.status}`);
    }

    if (stream) {
      if (!response.body) {
        throw new Error('Ollama response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const text = parsed.message?.content || '';
            res.write(`data: ${JSON.stringify({ 
              text, 
              eval_count: parsed.eval_count, 
              prompt_eval_count: parsed.prompt_eval_count,
              done: parsed.done 
            })}\n\n`);
          } catch (e) {
            // Support raw SSE data formats too
            if (line.startsWith('data: ')) {
              res.write(`${line}\n\n`);
            }
          }
        }
      }
      return res.end();
    } else {
      const data = await response.json();
      return res.json({ text: data.message?.content || '' });
    }
  } catch (error: any) {
    console.error('Ollama connection/execution error:', error);
    const errMsg = `Ollama connection failed at ${ollamaUrl}. Make sure Ollama is running locally (e.g. 'ollama run ${model}') and accessible. Error: ${error.message}`;
    if (stream) {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      return res.end();
    } else {
      return res.status(500).json({ error: errMsg });
    }
  }
});

// Setup Vite Dev server middleware or serve production static build
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static paths served.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JoelOS core container running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic();
