import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { patientId, doctorSlug, emergencyContactDetails, patientName } = await request.json();

    if (!patientId || !doctorSlug) {
      return NextResponse.json(
        { error: 'Patient ID and Doctor Slug are required' },
        { status: 400 }
      );
    }

    // Find the doctor by slug (assuming slug is the doctor's name or ID)
    const doctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorSlug },
          { name: { contains: doctorSlug } }
        ]
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Create a notification message with emergency contact details
    const notificationMessage = `🚨 EMERGENCY ALERT: Patient ${patientName} has been identified via face scan.

📞 Emergency Contact Details:
• Name: ${emergencyContactDetails.name}
• Phone: ${emergencyContactDetails.phone}

⚠️ Please contact the emergency contact immediately for this patient.`;

    // Find users linked to this patient (userboard recipients)
    const userLinks = await prisma.userPatient.findMany({
      where: { patientId },
      select: { userId: true }
    });

    // If no linked users, still create a conversation with a system user to keep a log
    const targetUserIds = userLinks.length > 0 ? userLinks.map(u => u.userId) : ['system-emergency'];

    const createdMessageIds: string[] = [];
    for (const uid of targetUserIds) {
      // Find or create a conversation for this doctor and user
      let conversation = await prisma.conversation.findFirst({
        where: { doctorId: doctor.id, userId: uid },
        orderBy: { createdAt: 'desc' }
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { doctorId: doctor.id, userId: uid }
        });
      }
      // Create the emergency notification message (from doctor)
      const msg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'DOCTOR',
          doctorName: doctor.name,
          content: notificationMessage,
        },
      });
      createdMessageIds.push(msg.id);
      await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    }

    console.log(`Emergency notification sent to ${createdMessageIds.length} recipient(s) for patient ${patientName}`);

    return NextResponse.json({
      success: true,
      message: 'Emergency notification sent to userboard',
      count: createdMessageIds.length,
      doctorName: doctor.name
    });

  } catch (error) {
    console.error('Error sending emergency notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send emergency notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorSlug = searchParams.get('doctorSlug');

    if (!doctorSlug) {
      return NextResponse.json(
        { error: 'Doctor Slug is required' },
        { status: 400 }
      );
    }

    // Find the doctor
    const doctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { id: doctorSlug },
          { name: { contains: doctorSlug } }
        ]
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Get recent emergency notifications for this doctor
    const conversation = await prisma.conversation.findFirst({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Get last 10 messages
        }
      }
    });

    const notifications = conversation?.messages || [];

    return NextResponse.json({
      success: true,
      notifications: notifications.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        senderType: msg.senderType
      }))
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

