import { NextResponse } from 'next/server';
export const runtime = 'node';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`;
    const orderCount = await prisma.order.count().catch(() => -1);
    const orderItemCount = await (prisma as any).orderItem?.count?.().catch?.(() => -1) ?? -1;
    return NextResponse.json({
      ok: true,
      tables: tables.map(t => t.name),
      counts: { order: orderCount, orderItem: orderItemCount },
      env: { databaseUrl: process.env.DATABASE_URL ?? null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



