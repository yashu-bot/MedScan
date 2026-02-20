import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

type ParamsPromise = { params: Promise<Record<string, string>> }

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('patient_session')?.value
    if (!userId) return NextResponse.json({ messages: [] }, { status: 200 })

    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId') || undefined

    const conversations = await prisma.conversation.findMany({
      where: { userId, doctorId: doctorId ?? undefined },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } }, doctor: true },
      take: 1,
    })
    const convo = conversations[0]
    return NextResponse.json({ conversation: convo ?? null })
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

    const body = await request.json()
    const { doctorId, content } = body ?? {}
    if (!doctorId || !content) {
      return NextResponse.json({ error: 'doctorId and content are required' }, { status: 400 })
    }

    // Find or create a conversation for this user + doctor
    let convo = await prisma.conversation.findFirst({ where: { userId, doctorId } })
    if (!convo) {
      convo = await prisma.conversation.create({ data: { userId, doctorId } })
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderType: 'PATIENT',
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


