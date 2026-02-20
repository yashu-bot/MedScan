const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    console.log('Starting USER data deletion...');

    // Counts for info
    const [userCount, profileCount, convCount, msgCount, apptCount, orderCount, linkCount] = await Promise.all([
      prisma.user.count(),
      prisma.patientProfile.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.appointment.count(),
      prisma.order.count(),
      prisma.userPatient.count(),
    ]);
    console.log(`Found users=${userCount}, profiles=${profileCount}, conversations=${convCount}, messages=${msgCount}, appointments=${apptCount}, orders=${orderCount}, links=${linkCount}`);

    // Delete in dependency order
    console.log('Deleting messages...');
    await prisma.message.deleteMany({});

    console.log('Deleting conversations...');
    await prisma.conversation.deleteMany({});

    console.log('Deleting appointments...');
    await prisma.appointment.deleteMany({});

    console.log('Deleting orders...');
    await prisma.order.deleteMany({});

    console.log('Deleting user-patient links...');
    await prisma.userPatient.deleteMany({});

    console.log('Deleting patient profiles...');
    await prisma.patientProfile.deleteMany({});

    console.log('Deleting users...');
    const result = await prisma.user.deleteMany({});

    console.log(`✅ Deleted ${result.count} users.`);
  } catch (e) {
    console.error('❌ Error deleting users:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteUserById(userId) {
  try {
    console.log(`Deleting data for user ${userId}...`);

    // Delete messages in the user's conversations
    const conversations = await prisma.conversation.findMany({ where: { userId }, select: { id: true } });
    const convoIds = conversations.map(c => c.id);
    if (convoIds.length) {
      await prisma.message.deleteMany({ where: { conversationId: { in: convoIds } } });
      await prisma.conversation.deleteMany({ where: { id: { in: convoIds } } });
    }

    await prisma.appointment.deleteMany({ where: { userId } });
    await prisma.order.deleteMany({ where: { customerUserId: userId } });
    await prisma.userPatient.deleteMany({ where: { userId } });
    await prisma.patientProfile.deleteMany({ where: { userId } });

    await prisma.user.delete({ where: { id: userId } });
    console.log('✅ User and related data deleted.');
  } catch (e) {
    console.error('❌ Error:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/delete-users.js --all');
    console.log('  node scripts/delete-users.js <userId>');
    return;
  }
  if (args[0] === '--all') {
    await deleteAllUsers();
  } else {
    await deleteUserById(args[0]);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });



