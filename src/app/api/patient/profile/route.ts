import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function requireUserId() {
  const cookieStore = await cookies();
  const id = cookieStore.get('patient_session')?.value;
  if (!id) throw new Error('UNAUTHORIZED');
  return id;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await prisma.patientProfile.findUnique({ where: { userId } });
    return NextResponse.json({ profile });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    // Use the logged-in patient's session; do NOT create a new user
    const userId = await requireUserId();
    const body = await request.json();
    const ServerSchema = z.object({
      name: z.string().min(1),
      age: z.union([z.number(), z.string()]).transform((v) => typeof v === 'string' ? parseInt(v, 10) : v).pipe(z.number().int().positive()),
      gender: z.string().min(1),
      bloodGroup: z.string().min(1),
      allergies: z.string().nullable().optional(),
      medicalConditions: z.string().nullable().optional(),
      recentSurgeries: z.string().nullable().optional(),
      implantedDevices: z.string().nullable().optional(),
      emergencyContactName: z.string().min(1),
      emergencyContactPhone: z.string().min(1),
      facialImagePreview: z.string().optional(),
    });
    const parsed = ServerSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const {
      name,
      age,
      gender,
      bloodGroup,
      allergies,
      medicalConditions,
      recentSurgeries,
      implantedDevices,
      emergencyContactName,
      emergencyContactPhone,
    } = parsed.data;

    // Upsert PatientProfile and Patient records for this user
    const createdProfile = await prisma.patientProfile.upsert({
      where: { userId },
      update: {
        name,
        age,
        gender,
        bloodGroup,
        allergies: allergies ?? null,
        medicalConditions: medicalConditions ?? null,
        recentSurgeries: recentSurgeries ?? null,
        implantedDevices: implantedDevices ?? null,
        emergencyContactName,
        emergencyContactPhone,
        faceImageUrl: parsed.data.facialImagePreview ?? null,
      },
      create: {
        userId,
        name,
        age,
        gender,
        bloodGroup,
        allergies: allergies ?? null,
        medicalConditions: medicalConditions ?? null,
        recentSurgeries: recentSurgeries ?? null,
        implantedDevices: implantedDevices ?? null,
        emergencyContactName,
        emergencyContactPhone,
        faceImageUrl: parsed.data.facialImagePreview ?? null,
      },
    });

    // Ensure there is a Patient record mirroring the profile
    let patient = await prisma.patient.findFirst({
      where: {
        name,
        age,
        gender,
        emergencyContactPhone,
      },
    });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name,
          age,
          gender,
          bloodGroup,
          allergies: allergies ?? '',
          medicalConditions: medicalConditions ?? '',
          recentSurgeries: recentSurgeries ?? '',
          implantedDevices: implantedDevices ?? '',
          emergencyContactName,
          emergencyContactPhone,
          faceImageUrl: parsed.data.facialImagePreview ?? null,
        },
      });
    }

    // Link the user to the patient via the many-to-many relationship if missing
    await prisma.userPatient.upsert({
      where: { userId_patientId: { userId, patientId: patient.id } },
      update: {},
      create: { userId, patientId: patient.id },
    });

    return NextResponse.json({ profile: createdProfile, patientId: patient.id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.age !== undefined) updateData.age = typeof body.age === 'string' ? parseInt(body.age, 10) : Number(body.age);
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
    if (body.allergies !== undefined) updateData.allergies = body.allergies ?? null;
    if (body.medicalConditions !== undefined) updateData.medicalConditions = body.medicalConditions ?? null;
    if (body.recentSurgeries !== undefined) updateData.recentSurgeries = body.recentSurgeries ?? null;
    if (body.implantedDevices !== undefined) updateData.implantedDevices = body.implantedDevices ?? null;
    if (body.emergencyContactName !== undefined) updateData.emergencyContactName = body.emergencyContactName;
    if (body.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = body.emergencyContactPhone;

    const updated = await prisma.patientProfile.update({ where: { userId }, data: updateData });
    return NextResponse.json({ profile: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}


