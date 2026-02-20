import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

interface Params { params: { id: string } }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.doctor.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



