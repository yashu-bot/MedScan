import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const avail = await prisma.availability.findMany({
      where: { doctorId: params.id },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: { appointments: { select: { id: true } } },
    })
    const withRemaining = avail.map(a => ({
      ...a,
      remaining: Math.max(0, a.capacity - (a.appointments?.length || 0)),
    }))
    return NextResponse.json({ availability: withRemaining })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { date, startTime, endTime, capacity } = body ?? {}
    if (!date || !startTime || !endTime || typeof capacity !== 'number') {
      return NextResponse.json({ error: 'date, startTime, endTime, capacity required' }, { status: 400 })
    }
    const created = await prisma.availability.create({
      data: { doctorId: params.id, date: new Date(date), startTime, endTime, capacity }
    })
    return NextResponse.json({ availability: created }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


