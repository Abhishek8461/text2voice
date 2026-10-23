/**
 * GET /.netlify/functions/health
 * Health check endpoint for Netlify Serverless deployment
 */
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Backend is running (Netlify Serverless Function)',
      timestamp: new Date().toISOString()
    })
  };
};
