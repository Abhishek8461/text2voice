import React from 'react';

/**
 * AudioPlayer Component
 * Controls real browser speech synthesis playback:
 * - Displays active voice and live speech status (Idle, Speaking, Paused)
 * - Animated waveform while speaking
 * - Working Speak, Pause, Resume, and Stop controls
 */
function AudioPlayer({
  playbackStatus = 'idle',
  onSpeak,
  onPause,
  onResume,
  onStop,
  onDownloadAudio,
  isDownloading = false,
  downloadError = '',
  downloadSuccess = '',
  currentVoiceName,
  text = '',
  isSpeechSupported = true,
  speechError = ''
}) {
  const isSpeaking = playbackStatus === 'speaking';
  const isPaused = playbackStatus === 'paused';
  const isIdle = playbackStatus === 'idle';

  return (
    <section className="glass-card player-card" aria-label="Audio Playback Section">
      <div className="player-header">
        <h2 className="player-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          Speech & Audio Controls
        </h2>

        {/* Live Status Badge */}
        <div className="status-badges-group">
          {isSpeaking && (
            <span className="brand-badge badge-speaking">
              <span className="pulsing-dot green"></span> Speaking
            </span>
          )}
          {isPaused && (
            <span className="brand-badge badge-paused">
              <span className="pulsing-dot yellow"></span> Paused
            </span>
          )}
          {isIdle && (
            <span className="brand-badge badge-idle">
              Ready
            </span>
          )}
        </div>
      </div>

      {/* Browser Speech Synthesis Not Supported Alert */}
      {!isSpeechSupported && (
        <div className="validation-alert" style={{ marginBottom: 16 }}>
          ⚠️ Web Speech API is not supported in this browser. Please open this app in Google Chrome, Microsoft Edge, or Safari.
        </div>
      )}

      {/* Speech Error Banner */}
      {speechError && (
        <div className="validation-alert" style={{ marginBottom: 16 }}>
          ❌ {speechError}
        </div>
      )}

      {/* Audio Download Success Banner */}
      {downloadSuccess && (
        <div
          className="validation-alert"
          style={{
            marginBottom: 16,
            background: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7'
          }}
        >
          ✅ {downloadSuccess}
        </div>
      )}

      {/* Audio Download Error Banner */}
      {downloadError && (
        <div className="validation-alert" style={{ marginBottom: 16 }}>
          ❌ {downloadError}
        </div>
      )}

      <div className="player-active" id="player-active-box">
        {/* Waveform graphic visualization - animates only when speaking */}
        <div className="waveform-visualizer" aria-hidden="true">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={`wave-bar ${isSpeaking ? 'animated' : ''}`}
              style={{
                height: isSpeaking ? undefined : `${10 + (i % 5) * 6}px`,
                opacity: isIdle ? 0.35 : 1
              }}
            ></div>
          ))}
        </div>

        {/* Playback Controls & Voice Info */}
        <div className="playback-controls">
          <div className="speech-controls-group">
            {/* 1. Speak Button */}
            <button
              type="button"
              id="speech-speak-btn"
              className="speech-ctrl-btn btn-speak"
              onClick={onSpeak}
              disabled={!text || text.trim() === '' || isSpeaking}
              title="Speak entered text using browser voice"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Speak</span>
            </button>

            {/* 2. Pause Button */}
            <button
              type="button"
              id="speech-pause-btn"
              className="speech-ctrl-btn btn-pause"
              onClick={onPause}
              disabled={!isSpeaking}
              title="Pause ongoing speech"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <span>Pause</span>
            </button>

            {/* 3. Resume Button */}
            <button
              type="button"
              id="speech-resume-btn"
              className="speech-ctrl-btn btn-resume"
              onClick={onResume}
              disabled={!isPaused}
              title="Resume paused speech"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Resume</span>
            </button>

            {/* 4. Stop Button */}
            <button
              type="button"
              id="speech-stop-btn"
              className="speech-ctrl-btn btn-stop"
              onClick={onStop}
              disabled={isIdle}
              title="Stop speech"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2"></rect>
              </svg>
              <span>Stop</span>
            </button>

            {/* 5. Download MP3 Button */}
            <button
              type="button"
              id="download-mp3-btn"
              className="speech-ctrl-btn btn-download"
              onClick={onDownloadAudio}
              disabled={!text || text.trim() === '' || isDownloading}
              title="Download speech audio as MP3 file"
            >
              {isDownloading ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }}></span>
                  <span>Generating MP3...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download MP3</span>
                </>
              )}
            </button>
          </div>

          {/* Active Voice Info Display */}
          <div className="speech-info-tag" title="Currently selected voice">
            <span className="speech-info-label">Active Voice:</span>
            <span className="speech-info-name">{currentVoiceName || 'Default Voice'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AudioPlayer;
