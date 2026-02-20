import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();
    
    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Find the Patient record linked to this PatientProfile via UserPatient
    const userPatient = await prisma.userPatient.findFirst({
      where: {
        user: {
          patientProfile: {
            userId: profileId
          }
        }
      },
      include: {
        patient: true
      }
    });

    if (!userPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      patientId: userPatient.patientId,
      patient: userPatient.patient
    });
  } catch (error) {
    console.error('Error finding patient:', error);
    return NextResponse.json({ error: 'Failed to find patient' }, { status: 500 });
  }
}

