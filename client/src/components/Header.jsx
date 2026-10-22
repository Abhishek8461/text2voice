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
        <span>EchoVoice Studio</span>
      </div>

      {/* Main Title with gradient highlights */}
      <h1 className="app-title">
        Transform Your Text Into <span>Natural Speech</span>
      </h1>

      {/* Short descriptive subtitle */}
      <p className="app-subtitle">
        Type or paste any text below, choose a voice and language, and listen to
        lifelike audio synthesis instantly in your browser.
      </p>
    </header>
  );
}

export default Header;
