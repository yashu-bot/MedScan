import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ employees });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password, location } = body ?? {};
    if (!name || !username || !password || !location) {
      return NextResponse.json({ error: 'name, username, password, location are required' }, { status: 400 });
    }
    const employee = await prisma.employee.create({ data: { name, username, password, location } });
    return NextResponse.json({ employee }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
