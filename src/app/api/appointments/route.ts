import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('patient_session')?.value
    if (!userId) return NextResponse.json({ appointments: [] })
    const appts = await prisma.appointment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { doctor: true, availability: true },
    })
    return NextResponse.json({ appointments: appts })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('patient_session')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { doctorId, availabilityId, timeSlot } = await request.json()
    if (!doctorId || !availabilityId) return NextResponse.json({ error: 'doctorId and availabilityId required' }, { status: 400 })

    // Ensure availability exists and remaining capacity
    const avail = await prisma.availability.findUnique({ where: { id: availabilityId }, include: { appointments: true } })
    if (!avail || avail.doctorId !== doctorId) return NextResponse.json({ error: 'Invalid availability' }, { status: 400 })
    if (avail.appointments.length >= avail.capacity) return NextResponse.json({ error: 'No slots available' }, { status: 400 })

    const nextToken = (avail.appointments?.length || 0) + 1
    const appt = await prisma.appointment.create({
      data: { doctorId, availabilityId, userId, timeSlot: timeSlot || avail.startTime, tokenNumber: nextToken },
      include: { doctor: true, availability: true },
    })
    return NextResponse.json({ appointment: appt }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


