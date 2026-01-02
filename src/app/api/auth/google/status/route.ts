import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify the token is still valid by making a test request
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        return NextResponse.json({ authenticated: true });
      } else {
        // Token might be expired, check if we have a refresh token
        const refreshToken = request.cookies.get('google_refresh_token')?.value;
        if (refreshToken) {
          // Try to refresh the token
          try {
            const refreshResponse = await fetch(`${request.nextUrl.origin}/api/auth/google/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refreshToken,
              }),
            });

            if (refreshResponse.ok) {
              return NextResponse.json({ authenticated: true });
            }
          } catch (error) {
            console.error('Token refresh error:', error);
          }
        }
        
        return NextResponse.json({ authenticated: false });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
