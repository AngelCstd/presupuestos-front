import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const res = await fetch('http://127.0.0.1:54321/mint-token');
    const { token, userId, email } = await res.json();

    const sessionData = {
      access_token: token,
      token_type: 'bearer',
      expires_in: 3600 * 24 * 30,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
      refresh_token: 'fake-refresh-token',
      user: {
        id: userId,
        email,
        role: 'authenticated',
        aud: 'authenticated',
      },
    };

    const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64url');
    const cookieStore = await cookies();

    cookieStore.set('sb-gshuzkuxvfjfopmlgkdo-auth-token', cookieValue, {
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600 * 24 * 30,
    });

    const url = new URL(request.url);
    const next = url.searchParams.get('next') || '/';
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con el servidor de autenticación local en el puerto 54321' },
      { status: 500 }
    );
  }
}
