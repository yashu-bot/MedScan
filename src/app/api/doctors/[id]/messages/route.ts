import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: params.id } })
    if (!doctor) return NextResponse.json({ conversation: null })

    const convo = await prisma.conversation.findFirst({
      where: { doctorId: doctor.id },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } }, user: true },
    })
    return NextResponse.json({ conversation: convo ?? null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: params.id } })
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

    const { content } = await request.json()
    if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })

    const convo = await prisma.conversation.findFirst({ where: { doctorId: doctor.id }, orderBy: { updatedAt: 'desc' } })
    if (!convo) return NextResponse.json({ error: 'No conversation found' }, { status: 404 })

    const message = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderType: 'DOCTOR',
        doctorName: doctor.name,
        content,
      },
    })
    await prisma.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } })

    return NextResponse.json({ message }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


