// Google OAuth2 Configuration
export const GOOGLE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  scope: 'https://www.googleapis.com/auth/drive.file',
};

// OAuth2 redirect URLs from environment variables
export const getRedirectUrl = () => {
  return process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL || 'http://localhost:3000/api/auth/google/callback';
};

// Google OAuth2 flow with popup
export const initiateGoogleAuth = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const redirectUrl = getRedirectUrl();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `scope=${encodeURIComponent(GOOGLE_CONFIG.scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    // Open popup window
    const popup = window.open(
      authUrl,
      'googleAuth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    // Check for popup closure or completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Check if authentication was successful
        checkAuthStatus().then((authenticated) => {
          if (authenticated) {
            resolve(true);
          } else {
            reject(new Error('Authentication failed or was cancelled'));
          }
        }).catch(reject);
      }
    }, 1000);

    // Listen for message from popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageListener);
        resolve(true);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageListener);
        reject(new Error(event.data.error || 'Authentication failed'));
      }
    };

    window.addEventListener('message', messageListener);
  });
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string) => {
  const redirectUrl = getRedirectUrl();
  
  const response = await fetch('/api/auth/google/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirectUri: redirectUrl,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
};

// Check authentication status
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/google/status');
    if (response.ok) {
      const data = await response.json();
      return data.authenticated;
    }
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch('/api/auth/google/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json();
};
