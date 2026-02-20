import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a hospital
  const hospital = await prisma.hospital.upsert({
    where: { name: 'City General Hospital' },
    update: {},
    create: {
      name: 'City General Hospital',
      address: '123 Main St',
    },
  })

  // Create a doctor linked to the hospital
  const doctor = await prisma.doctor.upsert({
    where: { id: 'seed-doctor-1' },
    update: {},
    create: {
      id: 'seed-doctor-1',
      name: 'Dr. Jane Smith',
      speciality: 'Cardiology',
      hospitalId: hospital.id,
    },
  })

  // Create a user and profile
  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      password: 'demo',
    },
  })

  const profile = await prisma.patientProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: 'John Doe',
      age: 42,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+10000000000',
    },
  })

  // Create a patient and link to user
  const patient = await prisma.patient.upsert({
    where: { id: 'seed-patient-1' },
    update: {},
    create: {
      id: 'seed-patient-1',
      name: 'John Doe',
      age: 42,
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: 'None',
      medicalConditions: 'Hypertension',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+10000000000',
    },
  })

  await prisma.userPatient.upsert({
    where: { userId_patientId: { userId: user.id, patientId: patient.id } },
    update: {},
    create: {
      userId: user.id,
      patientId: patient.id,
    },
  })

  // Create an order with items
  const employee = await prisma.employee.upsert({
    where: { username: 'rider1' },
    update: {},
    create: {
      name: 'Rider One',
      username: 'rider1',
      password: 'secret',
      location: 'Warehouse A',
    },
  })

  const order = await prisma.order.create({
    data: {
      customerName: 'Alice',
      phone: '+19999999999',
      address: '456 Market St',
      medication: 'Amoxicillin',
      quantity: 2,
      employeeId: employee.id,
      items: {
        create: [
          { name: 'Amoxicillin 500mg', quantity: 1 },
          { name: 'Vitamin C 1000mg', quantity: 1 },
        ],
      },
    },
  })

  // Add a medical note for the patient by the doctor
  await prisma.medicalNote.create({
    data: {
      content: 'Initial consultation notes.',
      doctorName: doctor.name,
      patientId: patient.id,
    },
  })

  console.log('Seed complete:', {
    hospital: hospital.name,
    doctor: doctor.name,
    user: user.username,
    profile: profile.name,
    patient: patient.name,
    orderId: order.id,
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


