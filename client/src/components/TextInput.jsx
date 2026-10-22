import React from 'react';

/**
 * TextInput Component
 * - Manages the text input area
 * - Live character counter & word counter
 * - Clear text button
 * - In-place validation message display
 */
function TextInput({ text, onTextChange, onClearText, validationError }) {
  // Calculate word count cleanly (filtering out empty whitespace strings)
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const maxChars = 1000;

  return (
    <div className="text-input-section">
      {/* Label and Clear button */}
      <div className="input-header">
        <label htmlFor="speech-input-field" className="input-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Enter Your Text
        </label>

        {/* Clear Button */}
        <button
          type="button"
          id="clear-text-btn"
          className="clear-btn"
          onClick={onClearText}
          disabled={charCount === 0}
          title="Clear all text"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Clear Text
        </button>
      </div>

      {/* Main Textarea */}
      <div className="textarea-container">
        <textarea
          id="speech-input-field"
          className="speech-textarea"
          placeholder="Start typing or paste the text you want converted to speech..."
          value={text}
          maxLength={maxChars}
          onChange={(e) => onTextChange(e.target.value)}
        ></textarea>
      </div>

      {/* Counters display */}
      <div className="textarea-footer">
        <div className="counter-group">
          <span className="counter-badge">
            Words: <strong>{wordCount}</strong>
          </span>
          <span className="counter-badge">
            Characters: <strong>{charCount}</strong> / {maxChars}
          </span>
        </div>
        <span>Max 1,000 characters</span>
      </div>

      {/* Helpful validation error message when empty */}
      {validationError && (
        <div className="validation-alert" id="validation-error-box" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

export default TextInput;
