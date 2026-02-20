import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json();
    const { delivered } = body;
    
    if (typeof delivered !== 'boolean') {
      return NextResponse.json({ error: 'delivered field is required and must be boolean' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: { delivered },
      include: { items: true, employee: true }
    });

    return NextResponse.json({ order });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
