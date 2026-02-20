import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('patient_session')?.value;
    if (!userId) return NextResponse.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user: { id: user.id, username: user.username } });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}


