import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 422 });
    }
    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    const user = await prisma.user.create({ data: { username: username.trim(), password: password.trim() } });
    const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username } }, { status: 201 });
    res.cookies.set('patient_session', user.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


