import React from 'react';

/**
 * VoiceControls Component
 * Provides dropdowns for Language and Voice selection,
 * as well as range sliders for Speed (rate) and Pitch.
 */
function VoiceControls({
  language,
  onLanguageChange,
  voice,
  onVoiceChange,
  speed,
  onSpeedChange,
  pitch,
  onPitchChange,
  voiceOptions = [],
  languageOptions = []
}) {
  return (
    <div className="controls-grid">
      {/* 1. Language Dropdown */}
      <div className="control-item">
        <label htmlFor="language-select" className="control-label">
          Language
        </label>
        <select
          id="language-select"
          className="styled-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {languageOptions && languageOptions.length > 0 ? (
            languageOptions.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))
          ) : (
            <>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish (Spain)</option>
              <option value="fr-FR">French (France)</option>
              <option value="de-DE">German (Germany)</option>
              <option value="hi-IN">Hindi (India)</option>
              <option value="ja-JP">Japanese (Japan)</option>
            </>
          )}
        </select>
      </div>

      {/* 2. Voice Dropdown */}
      <div className="control-item">
        <label htmlFor="voice-select" className="control-label">
          Voice Character
        </label>
        <select
          id="voice-select"
          className="styled-select"
          value={voice}
          onChange={(e) => onVoiceChange(e.target.value)}
        >
          {voiceOptions && voiceOptions.length > 0 ? (
            voiceOptions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.lang ? `(${v.lang})` : ''}
              </option>
            ))
          ) : (
            <option value="">Loading system voices...</option>
          )}
        </select>
      </div>

      {/* 3. Speed (Rate) Slider */}
      <div className="control-item">
        <label htmlFor="speed-slider" className="control-label">
          <span>Speed</span>
          <span className="control-value">{speed.toFixed(1)}x</span>
        </label>
        <div className="slider-container">
          <input
            id="speed-slider"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            className="styled-slider"
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* 4. Pitch Slider */}
      <div className="control-item">
        <label htmlFor="pitch-slider" className="control-label">
          <span>Pitch</span>
          <span className="control-value">{pitch.toFixed(1)}</span>
        </label>
        <div className="slider-container">
          <input
            id="pitch-slider"
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            className="styled-slider"
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

export default VoiceControls;
