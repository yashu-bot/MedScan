import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const appts = await prisma.appointment.findMany({
      where: { doctorId: params.id },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        availability: true,
        user: { select: { id: true, username: true, profile: { select: { name: true } } } },
      },
    })
    return NextResponse.json({ appointments: appts })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


