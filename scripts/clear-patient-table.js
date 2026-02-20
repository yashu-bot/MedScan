const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearPatientTable() {
  try {
    console.log('🗑️  Starting to clear Patient table...');
    
    // Check current patient count
    const patientCount = await prisma.patient.count();
    console.log(`Found ${patientCount} patients in the database`);
    
    if (patientCount === 0) {
      console.log('✅ Patient table is already empty!');
      return;
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
    
    console.log('🎉 Patient table cleared successfully!');
    console.log(`Summary: ${deletedPatients.count} patients, ${deletedNotes.count} medical notes, ${deletedUserPatients.count} relationships deleted`);
    
  } catch (error) {
    console.error('❌ Error clearing patient table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearPatientTable()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

