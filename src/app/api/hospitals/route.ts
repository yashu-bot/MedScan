import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ hospitals });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address } = body ?? {};
    if (!name || !address) {
      return NextResponse.json({ error: 'name and address are required' }, { status: 400 });
    }
    const hospital = await prisma.hospital.create({ data: { name, address } });
    return NextResponse.json({ hospital }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


