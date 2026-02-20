import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { patientIds, deleteAll = false } = body;

    if (deleteAll) {
      // Delete all patients and related data
      console.log('Deleting all patients...');
      
      // 1. Delete all medical notes
      const deletedNotes = await prisma.medicalNote.deleteMany({});
      console.log(`Deleted ${deletedNotes.count} medical notes`);
      
      // 2. Delete all user-patient relationships
      const deletedUserPatients = await prisma.userPatient.deleteMany({});
      console.log(`Deleted ${deletedUserPatients.count} user-patient relationships`);
      
      // 3. Delete all patients
      const deletedPatients = await prisma.patient.deleteMany({});
      console.log(`Deleted ${deletedPatients.count} patients`);
      
      return NextResponse.json({
        success: true,
        message: 'All patients and related data deleted successfully',
        deletedCounts: {
          patients: deletedPatients.count,
          medicalNotes: deletedNotes.count,
          userPatientRelations: deletedUserPatients.count
        }
      });
    } else if (patientIds && Array.isArray(patientIds)) {
      // Delete specific patients
      console.log(`Deleting patients: ${patientIds.join(', ')}`);
      
      let totalDeleted = {
        patients: 0,
        medicalNotes: 0,
        userPatientRelations: 0
      };

      for (const patientId of patientIds) {
        // 1. Delete medical notes for this patient
        const deletedNotes = await prisma.medicalNote.deleteMany({ 
          where: { patientId } 
        });
        totalDeleted.medicalNotes += deletedNotes.count;
        
        // 2. Delete user-patient relationships for this patient
        const deletedUserPatients = await prisma.userPatient.deleteMany({ 
          where: { patientId } 
        });
        totalDeleted.userPatientRelations += deletedUserPatients.count;
        
        // 3. Delete the patient
        await prisma.patient.delete({ where: { id: patientId } });
        totalDeleted.patients++;
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${patientIds.length} patients`,
        deletedCounts: totalDeleted
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide patientIds array or deleteAll: true' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete patients' },
      { status: 500 }
    );
  }
}

