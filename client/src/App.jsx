import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import TextInput from './components/TextInput';
import VoiceControls from './components/VoiceControls';
import AudioPlayer from './components/AudioPlayer';
import BackendStatus from './components/BackendStatus';
import ThemeToggle from './components/ThemeToggle';
import { getApiUrl } from './api';

/**
 * Friendly display labels for common BCP-47 language codes
 */
const LANGUAGE_LABELS = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  'fr-FR': 'French (France)',
  'de-DE': 'German (Germany)',
  'hi-IN': 'Hindi (India)',
  'ja-JP': 'Japanese (Japan)',
  'it-IT': 'Italian (Italy)',
  'pt-BR': 'Portuguese (Brazil)',
  'ru-RU': 'Russian (Russia)',
  'zh-CN': 'Chinese (Mandarin)',
  'ko-KR': 'Korean (South Korea)'
};

function formatLanguageLabel(code) {
  if (LANGUAGE_LABELS[code]) return LANGUAGE_LABELS[code];
  try {
    const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(code);
    return langName ? `${langName} (${code})` : code;
  } catch {
    return code;
  }
}

function getInitialTheme() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }
  return 'dark';
}

function App() {
  // Speech Synthesis reference to prevent garbage collection in Chrome
  const currentUtteranceRef = useRef(null);

  // Theme state: default to dark, persist in localStorage, follow prefers-color-scheme
  const [theme, setTheme] = useState(getInitialTheme);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        const nextTheme = e.matches ? 'light' : 'dark';
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  // 1. Text and validation state
  const [text, setText] = useState(
    'Hello! Welcome to EchoVoice. Type any text here to hear it converted into natural-sounding speech.'
  );
  const [validationError, setValidationError] = useState('');

  // 2. Voice and audio configuration state
  const [language, setLanguage] = useState('en-US');
  const [voice, setVoice] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  // 3. Web Speech API real browser state
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [voices, setVoices] = useState([]);
  const [playbackStatus, setPlaybackStatus] = useState('idle'); // 'idle' | 'speaking' | 'paused'
  const [speechError, setSpeechError] = useState('');

  // 4. Backend integration state
  const [isGenerating, setIsGenerating] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Initialize and load browser voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices && availableVoices.length > 0) {
        setVoices(availableVoices);

        // Pick an initial voice if none selected
        setVoice((prevVoice) => {
          if (prevVoice && availableVoices.some((v) => (v.voiceURI || v.name) === prevVoice)) {
            return prevVoice;
          }
          const defaultVoice =
            availableVoices.find((v) => v.default) ||
            availableVoices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en')) ||
            availableVoices[0];
          return defaultVoice ? (defaultVoice.voiceURI || defaultVoice.name) : '';
        });
      }
    };

    loadVoices();

    // In Chrome, voices are loaded asynchronously and dispatch 'voiceschanged'
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Format available language options from loaded system voices
  const availableLanguageCodes = Array.from(new Set(voices.map((v) => v.lang))).sort();
  const languageOptions =
    availableLanguageCodes.length > 0
      ? availableLanguageCodes.map((code) => ({ code, label: formatLanguageLabel(code) }))
      : [
        { code: 'en-US', label: 'English (US)' },
        { code: 'en-GB', label: 'English (UK)' },
        { code: 'es-ES', label: 'Spanish (Spain)' },
        { code: 'fr-FR', label: 'French (France)' },
        { code: 'de-DE', label: 'German (Germany)' },
        { code: 'hi-IN', label: 'Hindi (India)' },
        { code: 'ja-JP', label: 'Japanese (Japan)' }
      ];

  // Filter voices that match the chosen language (with fallback to all)
  const voicesForLang = voices.filter(
    (v) => v.lang === language || v.lang.startsWith(language.split('-')[0])
  );
  const currentVoiceList = voicesForLang.length > 0 ? voicesForLang : voices;
  const activeVoiceList = currentVoiceList.map((v) => ({
    id: v.voiceURI || v.name,
    name: v.name,
    lang: v.lang
  }));

  // Resolve currently active voice display name
  const currentVoiceObj = voices.find((v) => (v.voiceURI || v.name) === voice);
  const currentVoiceName = currentVoiceObj
    ? `${currentVoiceObj.name} (${currentVoiceObj.lang})`
    : voice;

  // Handle language change and pick default voice for that language
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const matchingVoices = voices.filter(
      (v) => v.lang === newLang || v.lang.startsWith(newLang.split('-')[0])
    );
    if (matchingVoices.length > 0) {
      setVoice(matchingVoices[0].voiceURI || matchingVoices[0].name);
    }
  };

  // Live text update & auto-clear validation errors when user types
  const handleTextChange = (newText) => {
    setText(newText);
    if (validationError && newText.trim() !== '') {
      setValidationError('');
    }
  };

  // Speak text using Web Speech API
  const speakText = () => {
    if (!('speechSynthesis' in window)) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!text || text.trim() === '') {
      setValidationError('Please enter some text before speaking (up to 1,000 characters).');
      return;
    }

    // 1. Cancel any active or paused speech
    window.speechSynthesis.cancel();
    setSpeechError('');
    setValidationError('');

    // 2. Create SpeechSynthesisUtterance instance
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance; // Prevent garbage collection bug in Chrome

    // 3. Configure voice, language, rate, and pitch
    const selectedVoiceObj = voices.find((v) => (v.voiceURI || v.name) === voice);
    if (selectedVoiceObj) {
      utterance.voice = selectedVoiceObj;
      utterance.lang = selectedVoiceObj.lang;
    } else if (language) {
      utterance.lang = language;
    }

    utterance.rate = speed;
    utterance.pitch = pitch;

    // 4. Attach event listeners for real playback status
    utterance.onstart = () => {
      setPlaybackStatus('speaking');
    };

    utterance.onpause = () => {
      setPlaybackStatus('paused');
    };

    utterance.onresume = () => {
      setPlaybackStatus('speaking');
    };

    utterance.onend = () => {
      setPlaybackStatus('idle');
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      // 'canceled' or 'interrupted' is normal when user clicks Stop or speaks new text
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setSpeechError(`Speech synthesis error: ${event.error}`);
      }
      setPlaybackStatus('idle');
      currentUtteranceRef.current = null;
    };

    // 5. Trigger browser speech synthesis
    window.speechSynthesis.speak(utterance);
  };

  // Pause speech
  const handlePause = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setPlaybackStatus('paused');
    }
  };

  // Resume paused speech
  const handleResume = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaybackStatus('speaking');
    }
  };

  // Stop speech
  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setPlaybackStatus('idle');
      currentUtteranceRef.current = null;
    }
  };

  // Clear Text functionality
  const handleClearText = () => {
    setText('');
    setValidationError('');
    setSubmissionResult(null);
    setSpeechError('');
    setDownloadError('');
    setDownloadSuccess('');
    handleStop();
  };

  // Real MP3 Download Handler via backend (supports free built-in TTS and OpenAI)
  const handleDownloadAudio = async () => {
    if (!text || text.trim() === '') {
      setValidationError('Please enter some text before generating audio (up to 1,000 characters).');
      return;
    }

    setIsDownloading(true);
    setDownloadError('');
    setDownloadSuccess('');

    try {
      // 1. Request MP3 binary from backend / Netlify serverless function
      const audioEndpoint = getApiUrl('audio');
      const response = await fetch(audioEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: 'alloy',
          language: language || 'en-US'
        })
      });

      if (!response.ok) {
        let errorText = `Server returned HTTP ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson.message) errorText = errorJson.message;
        } catch {
          // Response was not JSON
        }
        throw new Error(errorText);
      }

      // 2. Extract actual binary audio blob
      const blob = await response.blob();

      // 3. Create temporary browser object URL for downloading
      const downloadUrl = window.URL.createObjectURL(blob);

      // 4. Programmatically trigger download of real .mp3 file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'speech.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 5. Clean up temporary object URL to free browser memory
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);

      setDownloadSuccess('Speech audio MP3 downloaded successfully!');
      setTimeout(() => {
        setDownloadSuccess('');
      }, 5000);
    } catch (error) {
      console.error('Download audio error:', error);
      let errMsg = error.message;
      if (errMsg === 'Failed to fetch') {
        errMsg = 'Failed to connect to the audio service. If deployed on Netlify, please verify Netlify Functions or set VITE_API_URL.';
      }
      setDownloadError(
        errMsg || 'Failed to generate audio file. Please try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate Speech Button Handler - Speaks text and submits to backend
  const handleGenerateSpeech = async () => {
    if (!text || text.trim() === '') {
      setValidationError('Please enter some text before generating speech.');
      return;
    }

    // 1. Speak using browser Web Speech API immediately
    speakText();

    // 2. Submit text to backend in background
    setIsGenerating(true);
    try {
      const textEndpoint = getApiUrl('text');
      const response = await fetch(textEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmissionResult({
          type: 'error',
          status: response.status,
          message: data.message || `Server returned HTTP ${response.status}`
        });
      } else {
        setSubmissionResult({
          type: 'success',
          status: response.status,
          message: data.message,
          text: data.text
        });
      }
    } catch {
      // Backend offline does not disrupt browser speech
    } finally {
      setIsGenerating(false);
    }
  };

  // IntersectionObserver to fade-up sections as they scroll into view
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = document.querySelectorAll('.glass-card, .backend-status-card, .feature-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-page">
      {/* 1. Sticky Navigation Bar */}
      <nav className="site-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="brand-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#4F46E5" />
                <path d="M6 10v4M10 7v10M14 6v12M18 9v6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="brand-name">EchoVoice</span>
          </div>

          <div className="navbar-links">
            <a href="/" className="nav-link active">Home</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#voices" className="nav-link">Voices</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          <div className="navbar-actions">
            <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />
          </div>
        </div>
      </nav>

      {/* 2. Main Content Container with Decorative Blobs */}
      <div className="app-container">
        {/* 3 decorative blurred blobs */}
        <div className="glass-blob blob-indigo" aria-hidden="true"></div>
        <div className="glass-blob blob-violet" aria-hidden="true"></div>
        <div className="glass-blob blob-sky" aria-hidden="true"></div>

        {/* 3D floating orbs (decorative) */}
        <div className="hero-orb hero-orb--large" aria-hidden="true">
          <div className="orb-ring-wrap"><div className="orb-ring"></div></div>
        </div>
        <div className="hero-orb hero-orb--small" aria-hidden="true">
          <div className="orb-ring-wrap"><div className="orb-ring"></div></div>
        </div>

        <div className="app-wrapper">
          {/* Header with Title & Description */}
          <Header />

          {/* Backend Connection Health Check */}
          <BackendStatus />

          {/* Main Studio Card */}
          <main className="glass-card">
            {/* Text Area & Character/Word Counters */}
            <TextInput
              text={text}
              onTextChange={handleTextChange}
              onClearText={handleClearText}
              validationError={validationError}
            />

            {/* Dropdowns (Language, Voice) and Sliders (Speed, Pitch) */}
            <VoiceControls
              language={language}
              onLanguageChange={handleLanguageChange}
              voice={voice}
              onVoiceChange={setVoice}
              speed={speed}
              onSpeedChange={setSpeed}
              pitch={pitch}
              onPitchChange={setPitch}
              voiceOptions={activeVoiceList}
              languageOptions={languageOptions}
            />

            {/* Generate Speech Action Button */}
            <div className="action-row">
              <button
                type="button"
                id="generate-speech-btn"
                className="generate-btn"
                onClick={handleGenerateSpeech}
                disabled={playbackStatus === 'speaking' || isGenerating}
                title="Convert text to speech using Web Speech API"
              >
                {playbackStatus === 'speaking' ? (
                  <>
                    <span className="spinner"></span>
                    Speaking...
                  </>
                ) : isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    Generate Speech
                  </>
                )}
              </button>
            </div>

            {/* Backend Text Submission Feedback Display */}
            {submissionResult && (
              <div
                id="text-submission-result"
                className={`submission-feedback-box feedback-${submissionResult.type}`}
              >
                <div className="feedback-header">
                  <span className={`feedback-icon-dot dot-${submissionResult.type}`}></span>
                  <strong>
                    {submissionResult.type === 'success'
                      ? `Backend Response (${submissionResult.status} OK)`
                      : `Backend Error ${submissionResult.status ? `(${submissionResult.status})` : '(Offline)'}`}
                  </strong>
                </div>
                <p className="feedback-message">{submissionResult.message}</p>
                {submissionResult.text && (
                  <div className="feedback-received-text">
                    <span className="feedback-label">Server received text:</span>
                    <code>&ldquo;{submissionResult.text}&rdquo;</code>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Real Speech Playback & MP3 Download Section */}
          <AudioPlayer
            playbackStatus={playbackStatus}
            onSpeak={speakText}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onDownloadAudio={handleDownloadAudio}
            isDownloading={isDownloading}
            downloadError={downloadError}
            downloadSuccess={downloadSuccess}
            currentVoiceName={currentVoiceName}
            text={text}
            isSpeechSupported={isSpeechSupported}
            speechError={speechError}
          />

          {/* Features Showcase Section */}
          <section className="features-section" id="features" aria-label="Feature Highlights">
            <h2 className="features-title">Everything you need to create great audio</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <h3 className="feature-heading">Instant generation</h3>
                <p className="feature-description">
                  Turn any script into clear, natural speech in seconds, right in your browser.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <h3 className="feature-heading">Multiple languages</h3>
                <p className="feature-description">
                  Choose from a wide range of languages, accents and voices for every audience.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <h3 className="feature-heading">Download as MP3</h3>
                <p className="feature-description">
                  Save your audio in one click and use it in videos, podcasts or presentations.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 3. Site Footer (Matches reference design) */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="footer-logo">
                <div className="brand-logo-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#4F46E5" />
                    <path d="M6 10v4M10 7v10M14 6v12M18 9v6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="footer-brand-name">EchoVoice</span>
              </div>
              <p className="footer-tagline">
                Modern text-to-speech for creators, teams and learners.
              </p>
            </div>

            <div className="footer-links-group">
              <div className="footer-col">
                <h4 className="footer-col-title">Product</h4>
                <ul className="footer-links">
                  <li><a href="#features">Features</a></li>
                  <li><a href="#voices">Voices</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4 className="footer-col-title">Company</h4>
                <ul className="footer-links">
                  <li><a href="#about">About</a></li>
                  <li><a href="#contact">Contact</a></li>
                  <li><a href="#blog">Blog</a></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4 className="footer-col-title">Legal</h4>
                <ul className="footer-links">
                  <li><a href="#privacy">Privacy Policy</a></li>
                  <li><a href="#terms">Terms of Use</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">© 2026 EchoVoice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
