import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: Request, { params }: { params: { id: string, appointmentId: string } }) {
  try {
    const { id: doctorId, appointmentId } = params
    if (!doctorId || !appointmentId) {
      return NextResponse.json({ error: 'doctor id and appointment id required' }, { status: 400 })
    }

    const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } })
    if (!appt || appt.doctorId !== doctorId) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await prisma.appointment.delete({ where: { id: appointmentId } })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


