import React from 'react';

/**
 * Header Component
 * Displays the website title, soundwave logo, and an introductory description.
 */
function Header() {
  return (
    <header className="app-header">
      {/* Modern status badge */}
      <div className="brand-badge">
        <span className="pulse-dot"></span>
        <span>AI Text to Speech</span>
      </div>

      {/* Main Title */}
      <h1 className="app-title">
        Give your words a voice
      </h1>

      {/* Short descriptive subtitle */}
      <p className="app-subtitle">
        Paste your text, pick a voice and generate natural-sounding audio in seconds. Free, fast and simple.
      </p>
    </header>
  );
}

export default Header;
