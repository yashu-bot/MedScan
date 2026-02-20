import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const specs = await prisma.doctor.findMany({
      select: { speciality: true },
      distinct: ['speciality'],
      orderBy: { speciality: 'asc' },
    })
    return NextResponse.json({ specializations: specs.map(s => s.speciality) })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


