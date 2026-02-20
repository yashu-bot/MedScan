const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllPatients() {
  try {
    console.log('Starting patient data deletion...');
    
    // Get current counts before deletion
    const [patientCount, noteCount, userPatientCount] = await Promise.all([
      prisma.patient.count(),
      prisma.medicalNote.count(),
      prisma.userPatient.count()
    ]);
    
    console.log(`Found ${patientCount} patients, ${noteCount} medical notes, ${userPatientCount} user-patient relationships`);
    
    if (patientCount === 0) {
      console.log('No patients found to delete.');
      return;
    }
    
    // Delete in the correct order to avoid foreign key constraints
    console.log('Deleting medical notes...');
    const deletedNotes = await prisma.medicalNote.deleteMany({});
    console.log(`Deleted ${deletedNotes.count} medical notes`);
    
    console.log('Deleting user-patient relationships...');
    const deletedUserPatients = await prisma.userPatient.deleteMany({});
    console.log(`Deleted ${deletedUserPatients.count} user-patient relationships`);
    
    console.log('Deleting patients...');
    const deletedPatients = await prisma.patient.deleteMany({});
    console.log(`Deleted ${deletedPatients.count} patients`);
    
    console.log('✅ All patient data deleted successfully!');
    console.log(`Summary: ${deletedPatients.count} patients, ${deletedNotes.count} medical notes, ${deletedUserPatients.count} user-patient relationships`);
    
  } catch (error) {
    console.error('❌ Error deleting patient data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteSpecificPatient(patientId) {
  try {
    console.log(`Deleting patient with ID: ${patientId}`);
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        medicalHistory: true,
        users: true
      }
    });
    
    if (!patient) {
      console.log('❌ Patient not found');
      return;
    }
    
    console.log(`Found patient: ${patient.name} with ${patient.medicalHistory.length} medical notes and ${patient.users.length} user relationships`);
    
    // Delete related data
    console.log('Deleting medical notes...');
    const deletedNotes = await prisma.medicalNote.deleteMany({ 
      where: { patientId } 
    });
    console.log(`Deleted ${deletedNotes.count} medical notes`);
    
    console.log('Deleting user-patient relationships...');
    const deletedUserPatients = await prisma.userPatient.deleteMany({ 
      where: { patientId } 
    });
    console.log(`Deleted ${deletedUserPatients.count} user-patient relationships`);
    
    console.log('Deleting patient...');
    await prisma.patient.delete({ where: { id: patientId } });
    console.log(`✅ Patient ${patient.name} deleted successfully!`);
    
  } catch (error) {
    console.error('❌ Error deleting patient:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node delete-patients.js                    # Delete all patients');
    console.log('  node delete-patients.js <patient-id>       # Delete specific patient');
    console.log('  node delete-patients.js --confirm-all      # Delete all patients with confirmation');
    return;
  }
  
  if (args[0] === '--confirm-all') {
    console.log('⚠️  WARNING: This will delete ALL patient data!');
    console.log('This action cannot be undone.');
    console.log('To proceed, run: node delete-patients.js --confirm-all --yes');
    
    if (args[1] === '--yes') {
      await deleteAllPatients();
    } else {
      console.log('Operation cancelled. Add --yes flag to confirm.');
    }
  } else if (args[0] === '--all') {
    await deleteAllPatients();
  } else {
    // Delete specific patient
    await deleteSpecificPatient(args[0]);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});

