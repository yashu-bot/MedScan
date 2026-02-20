import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({ include: { hospital: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ doctors });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, speciality, hospitalId } = body ?? {};
    if (!name || !speciality) {
      return NextResponse.json({ error: 'name and speciality are required' }, { status: 400 });
    }
    const doctor = await prisma.doctor.create({ data: { name, speciality, hospitalId: hospitalId || null } });
    return NextResponse.json({ doctor }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
