import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get both PatientProfile and Patient records
    const [profiles, patients] = await Promise.all([
      prisma.patientProfile.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          medicalHistory: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    ]);

    console.log('Found profiles:', profiles.length);
    console.log('Found patients:', patients.length);
    console.log('Patients with medical history:', patients.filter(p => p.medicalHistory.length > 0).length);

    // Map PatientProfile to PatientData shape
    const profileMapped = profiles.map((p) => ({
      id: p.userId,
      name: p.name,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies ?? '',
      medicalConditions: p.medicalConditions ?? '',
      recentSurgeries: p.recentSurgeries ?? '',
      implantedDevices: p.implantedDevices ?? '',
      emergencyContactName: p.emergencyContactName,
      emergencyContactPhone: p.emergencyContactPhone,
      faceImageUrl: p.faceImageUrl ?? '',
      registeredAt: p.createdAt,
      username: p.user.username,
      medicalHistory: [] // No medical history in PatientProfile
    }));

    // Map Patient to PatientData shape
    const patientMapped = patients.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies ?? '',
      medicalConditions: p.medicalConditions ?? '',
      recentSurgeries: p.recentSurgeries ?? '',
      implantedDevices: p.implantedDevices ?? '',
      emergencyContactName: p.emergencyContactName,
      emergencyContactPhone: p.emergencyContactPhone,
      faceImageUrl: p.faceImageUrl ?? '',
      registeredAt: p.createdAt,
      username: `patient_${p.id.slice(-6)}`, // Generate username for Patient records
      medicalHistory: p.medicalHistory.map(note => ({
        date: note.date.toISOString(),
        content: note.content,
        doctorName: note.doctorName || 'Unknown Doctor',
        createdAt: note.createdAt.toISOString()
      }))
    }));

    // Combine both lists, prioritizing Patient records (which have medical history)
    const allPatients = [...patientMapped, ...profileMapped];
    
    return NextResponse.json({ 
      patients: allPatients,
      total: allPatients.length,
      message: `Found ${allPatients.length} registered patients (${patientMapped.length} with medical history)`
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


