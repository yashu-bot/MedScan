import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: { medicalHistory: true },
  });
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PATCH(request: Request, { params }: Params) {
  const data = await request.json();
  const patient = await prisma.patient.update({ where: { id: params.id }, data });
  return NextResponse.json(patient);
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    // First, delete all related data in the correct order
    // 1. Delete medical notes (they reference patient)
    await prisma.medicalNote.deleteMany({ 
      where: { patientId: params.id } 
    });
    
    // 2. Delete user-patient relationships
    await prisma.userPatient.deleteMany({ 
      where: { patientId: params.id } 
    });
    
    // 3. Finally delete the patient
    await prisma.patient.delete({ where: { id: params.id } });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Patient and all related data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' }, 
      { status: 500 }
    );
  }
}


