import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    console.log('🗑️  Starting to clear Patient table...');
    
    // Check current patient count
    const patientCount = await prisma.patient.count();
    console.log(`Found ${patientCount} patients in the database`);
    
    if (patientCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Patient table is already empty',
        deletedCounts: {
          patients: 0,
          medicalNotes: 0,
          userPatientRelations: 0
        }
      });
    }
    
    // Delete all medical notes first (they reference patients)
    console.log('Deleting medical notes...');
    const deletedNotes = await prisma.medicalNote.deleteMany({});
    console.log(`✅ Deleted ${deletedNotes.count} medical notes`);
    
    // Delete all user-patient relationships
    console.log('Deleting user-patient relationships...');
    const deletedUserPatients = await prisma.userPatient.deleteMany({});
    console.log(`✅ Deleted ${deletedUserPatients.count} user-patient relationships`);
    
    // Finally, delete all patients
    console.log('Deleting all patients...');
    const deletedPatients = await prisma.patient.deleteMany({});
    console.log(`✅ Deleted ${deletedPatients.count} patients`);
    
    return NextResponse.json({
      success: true,
      message: 'Patient table cleared successfully',
      deletedCounts: {
        patients: deletedPatients.count,
        medicalNotes: deletedNotes.count,
        userPatientRelations: deletedUserPatients.count
      }
    });
    
  } catch (error) {
    console.error('❌ Error clearing patient table:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear patient table',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

