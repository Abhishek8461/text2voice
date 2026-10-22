require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// 1. Enable CORS so our React frontend (running on port 5173) can communicate with this server
app.use(cors());

// 2. Enable parsing of incoming JSON request bodies (needed for receiving text from frontend)
app.use(express.json());

// GET /api/health - Health check endpoint to verify backend status
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running'
  });
});

// POST /api/text - Receive and validate text submission from frontend
app.post('/api/text', (req, res) => {
  const { text } = req.body || {};

  // 1. Reject empty or whitespace-only text with HTTP status 400
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Text cannot be empty or contain only whitespace.'
    });
  }

  // 2. Reject text longer than 1000 characters with HTTP status 400
  if (text.length > 1000) {
    return res.status(400).json({
      success: false,
      message: `Text cannot exceed 1000 characters. (Received ${text.length} characters)`
    });
  }

  // 3. Return JSON success response containing message and received text
  res.json({
    success: true,
    message: 'Text received successfully by backend',
    text: text
  });
});

/**
 * Fetch a single audio chunk from Google Translate TTS endpoint
 */
function getGoogleTTSChunk(text, lang = 'en') {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(text)}`;
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Google TTS returned HTTP status ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', (err) => reject(err));
    req.setTimeout(12000, () => {
      req.destroy(new Error('Google TTS request timed out'));
    });
  });
}

/**
 * Split text into sensible chunks under 170 characters, breaking at sentence / punctuation / word boundaries
 */
function splitTextForTTS(text, maxChunkLen = 170) {
  const chunks = [];
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + ' ' + trimmed).trim().length <= maxChunkLen) {
      current = current ? `${current} ${trimmed}` : trimmed;
    } else {
      if (current) {
        chunks.push(current);
        current = '';
      }
      if (trimmed.length <= maxChunkLen) {
        current = trimmed;
      } else {
        const words = trimmed.split(/\s+/);
        for (const word of words) {
          if ((current + ' ' + word).trim().length <= maxChunkLen) {
            current = current ? `${current} ${word}` : word;
          } else {
            if (current) chunks.push(current);
            current = word;
          }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Synthesize complete MP3 audio buffer from text using Google TTS
 */
async function generateGoogleTTS(text, lang = 'en') {
  const chunks = splitTextForTTS(text);
  const buffers = [];
  for (const chunk of chunks) {
    const buf = await getGoogleTTSChunk(chunk, lang);
    buffers.push(buf);
  }
  return Buffer.concat(buffers);
}

// POST /api/audio - Generate MP3 audio using OpenAI Audio API or built-in free TTS
app.post('/api/audio', async (req, res) => {
  try {
    const { text, voice, language } = req.body || {};

    // 1. Validate text presence and non-whitespace
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Text cannot be empty or contain only whitespace.'
      });
    }

    // 2. Validate max character limit (1,000 characters)
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: `Text cannot exceed 1000 characters. (Received ${text.length} characters)`
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const hasOpenAI = apiKey && apiKey.trim() !== '' && apiKey !== 'your_openai_api_key_here';
    let audioBuffer = null;
    let provider = 'built-in-tts';

    // 3. If OpenAI key is present and configured, attempt to use OpenAI Audio API
    if (hasOpenAI) {
      try {
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        const selectedVoice = validVoices.includes(voice) ? voice : (process.env.OPENAI_TTS_VOICE || 'alloy');
        const selectedModel = process.env.OPENAI_TTS_MODEL || 'tts-1';

        const openai = new OpenAI({ apiKey });
        const response = await openai.audio.speech.create({
          model: selectedModel,
          voice: selectedVoice,
          input: text
        });

        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        provider = 'openai';
      } catch (openAiError) {
        console.warn('OpenAI TTS synthesis failed, falling back to free built-in TTS:', openAiError?.message || openAiError);
      }
    }

    // 4. If OpenAI is not configured or failed, synthesize audio using the free built-in TTS
    if (!audioBuffer) {
      const selectedLang = language || 'en';
      audioBuffer = await generateGoogleTTS(text, selectedLang);
      provider = 'built-in-tts';
    }

    // 5. Stream the actual MP3 bytes to the client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('X-Audio-Provider', provider);
    res.send(audioBuffer);
  } catch (error) {
    console.error('Audio generation error:', error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to generate audio file. Please try again.'
    });
  }
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
