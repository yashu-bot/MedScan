import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

interface ParamsPromise {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: ParamsPromise) {
  try {
    const { id } = await params;
    // First try to find notes for a Patient record
    let notes = await prisma.medicalNote.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' }
    });
    
    // If no notes found, check if this is a PatientProfile userId
    if (notes.length === 0) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: id }
      });
      
      if (patientProfile) {
        // Look for a corresponding Patient record
        const patient = await prisma.patient.findFirst({
          where: {
            name: patientProfile.name,
            age: patientProfile.age,
            gender: patientProfile.gender
          }
        });
        
        if (patient) {
          notes = await prisma.medicalNote.findMany({
            where: { patientId: patient.id },
            orderBy: { createdAt: 'desc' }
          });
        }
      }
    }
    
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching medical notes:', error);
    return NextResponse.json({ error: 'Failed to fetch medical notes' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: ParamsPromise) {
  try {
    const { id } = await params;
    const { content, doctorName } = await request.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    let patientId = id;

    // Check if this is a PatientProfile userId, and if so, find or create a corresponding Patient record
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: id }
    });

    if (patientProfile) {
      // Look for an existing Patient record with matching details
      let patient = await prisma.patient.findFirst({
        where: {
          name: patientProfile.name,
          age: patientProfile.age,
          gender: patientProfile.gender
        }
      });

      // If no matching Patient record exists, create one
      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            name: patientProfile.name,
            age: patientProfile.age,
            gender: patientProfile.gender,
            bloodGroup: patientProfile.bloodGroup,
            allergies: patientProfile.allergies || '',
            medicalConditions: patientProfile.medicalConditions || '',
            recentSurgeries: patientProfile.recentSurgeries || '',
            implantedDevices: patientProfile.implantedDevices || '',
            emergencyContactName: patientProfile.emergencyContactName,
            emergencyContactPhone: patientProfile.emergencyContactPhone,
            faceImageUrl: patientProfile.faceImageUrl || ''
          }
        });
      }

      patientId = patient.id;
    }

    const note = await prisma.medicalNote.create({
      data: {
        content: content.trim(),
        doctorName: doctorName || 'Unknown Doctor',
        patientId: patientId,
      }
    });
    
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating medical note:', error);
    return NextResponse.json({ error: 'Failed to create medical note' }, { status: 500 });
  }
}


