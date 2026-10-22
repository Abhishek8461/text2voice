import React, { useState } from 'react';

/**
 * BackendStatus Component
 * Tests the connection to the Express backend (GET /api/health)
 * and displays the live connection status to the user.
 */
function BackendStatus() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const checkConnection = async () => {
    // 1. Prevent repeated clicks and set loading state
    setStatus('loading');
    setMessage('Connecting to http://localhost:5000/api/health...');

    try {
      // 2. Send GET request to the Express backend
      const response = await fetch('http://localhost:5000/api/health');

      // 3. Verify HTTP status is OK (status code 200-299)
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      // 4. Parse JSON body returned by the server
      const data = await response.json();

      // 5. Update state with the backend's message
      setStatus('success');
      setMessage(data.message || 'Backend is running');
    } catch (error) {
      // 6. Catch network failures or server offline errors
      setStatus('error');
      setMessage(
        'Unable to connect to backend at http://localhost:5000. Please ensure "npm start" is running in your server terminal.'
      );
    }
  };

  return (
    <div className="backend-status-card" id="backend-status-section">
      <div className="backend-status-header">
        <div className="backend-status-title">
          <span className={`status-indicator-dot status-${status}`}></span>
          <strong>Backend Connection:</strong>
          <code className="endpoint-tag">GET http://localhost:5000/api/health</code>
        </div>

        <button
          type="button"
          id="check-backend-btn"
          className="check-connection-btn"
          onClick={checkConnection}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14 }}></span>
              Checking...
            </>
          ) : (
            'Check Connection'
          )}
        </button>
      </div>

      {/* Status Output Box */}
      {status !== 'idle' && (
        <div className={`status-result-box status-result-${status}`}>
          {status === 'loading' && <span>⏳ {message}</span>}
          {status === 'success' && <span>✅ <strong>Connected:</strong> {message}</span>}
          {status === 'error' && <span>❌ <strong>Error:</strong> {message}</span>}
        </div>
      )}
    </div>
  );
}

export default BackendStatus;
