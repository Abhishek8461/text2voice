const https = require('https');

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
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
 * Split text into chunks under 170 characters at sentence/word boundaries
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

/**
 * Synthesize audio via OpenAI TTS (when OPENAI_API_KEY is configured in Netlify environment)
 */
async function generateOpenAITTS(text, voice = 'alloy', apiKey) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'tts-1',
      voice: voice || 'alloy',
      input: text
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * POST /.netlify/functions/audio
 * Generates and returns MP3 binary audio file
 */
exports.handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
    };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const { text, voice, language } = payload;

    // 1. Validate text presence and non-whitespace
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Text cannot be empty or contain only whitespace.'
        })
      };
    }

    // 2. Validate max character limit (1,000 characters)
    if (text.length > 1000) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: `Text cannot exceed 1000 characters. (Received ${text.length} characters)`
        })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const hasOpenAI = apiKey && apiKey.trim() !== '' && apiKey !== 'your_openai_api_key_here';
    let audioBuffer = null;
    let provider = 'built-in-tts';

    // 3. Optional OpenAI synthesis if key provided in environment variables
    if (hasOpenAI) {
      try {
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';
        audioBuffer = await generateOpenAITTS(text, selectedVoice, apiKey);
        provider = 'openai';
      } catch (openAiError) {
        console.warn('OpenAI TTS failed, falling back to free Google TTS:', openAiError?.message || openAiError);
      }
    }

    // 4. Default to free built-in Google TTS
    if (!audioBuffer) {
      const selectedLang = language || 'en';
      audioBuffer = await generateGoogleTTS(text, selectedLang);
      provider = 'built-in-tts';
    }

    // 5. Return binary MP3 to the browser using Netlify isBase64Encoded protocol
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"',
        'Content-Length': String(audioBuffer.length),
        'X-Audio-Provider': provider,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: audioBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Audio generation error:', error?.message || error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: error?.message || 'Failed to generate audio file. Please try again.'
      })
    };
  }
};
