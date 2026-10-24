import React, { useRef } from 'react';

/**
 * ThemeToggle Component
 * A segmented pill toggle in the header with Dark (moon icon) and Light (sun icon) options.
 * Keyboard accessible with role="group", aria-label="Theme", arrow-key support, and visible focus rings.
 */
function ThemeToggle({ theme, onThemeChange }) {
  const darkBtnRef = useRef(null);
  const lightBtnRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      onThemeChange('light');
      lightBtnRef.current?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      onThemeChange('dark');
      darkBtnRef.current?.focus();
    }
  };

  return (
    <div
      className="theme-toggle-pill"
      role="group"
      aria-label="Theme"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={darkBtnRef}
        type="button"
        id="theme-btn-dark"
        className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
        aria-pressed={theme === 'dark'}
        onClick={() => onThemeChange('dark')}
        title="Switch to Dark theme"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span>Dark</span>
      </button>

      <button
        ref={lightBtnRef}
        type="button"
        id="theme-btn-light"
        className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
        aria-pressed={theme === 'light'}
        onClick={() => onThemeChange('light')}
        title="Switch to Light theme"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <span>Light</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
