import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (username === 'admin' && password === 'admin123') {
      const res = NextResponse.json({ ok: true }, { status: 200 });
      res.cookies.set('app_session', 'logged_in', { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 });
      return res;
    }
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
}



