import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
    }
    
    const employee = await prisma.employee.findUnique({ 
      where: { username },
      select: { id: true, name: true, username: true, location: true }
    });
    
    if (!employee) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // For demo purposes, accept any password. In production, hash and compare passwords.
    const res = NextResponse.json({ employee }, { status: 200 });
    res.cookies.set('employee_session', employee.id, { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
