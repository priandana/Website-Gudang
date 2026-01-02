'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('OAuth callback triggered', { 
        isPopup: !!window.opener, 
        code: searchParams.get('code'), 
        error: searchParams.get('error') 
      });
      
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_ERROR', 
              error: error 
            }, window.location.origin);
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            setTimeout(() => {
              router.push('/?error=' + error);
            }, 2000);
          }
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          setStatus('error');
          
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_ERROR', 
              error: 'No authorization code received' 
            }, window.location.origin);
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            setTimeout(() => {
              router.push('/?error=no_code');
            }, 2000);
          }
          return;
        }

        // Exchange code for tokens
        const response = await fetch('/api/auth/google/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const tokenData = await response.json();

        // Store tokens in localStorage
        if (tokenData.access_token) {
          localStorage.setItem('google_access_token', tokenData.access_token);
          if (tokenData.refresh_token) {
            localStorage.setItem('google_refresh_token', tokenData.refresh_token);
          }
          if (tokenData.expires_in) {
            const expiryTime = Date.now() + (tokenData.expires_in * 1000);
            localStorage.setItem('google_token_expiry', expiryTime.toString());
          }
        }

        // Also store tokens in cookies via API for server-side access
        await fetch('/api/auth/google/store-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenData),
        });

        setStatus('success');
        
        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, window.location.origin);
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          setTimeout(() => {
            router.push('/?auth=success');
          }, 2000);
        }

      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'GOOGLE_AUTH_ERROR', 
            error: 'Authentication failed' 
          }, window.location.origin);
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          setTimeout(() => {
            router.push('/?error=auth_failed');
          }, 2000);
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to Google Drive...</h2>
              <p className="text-gray-600">Please wait while we complete the authentication.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Connected!</h2>
              <p className="text-gray-600">Redirecting you back to the app...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-gray-600">Redirecting you back to the app...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
