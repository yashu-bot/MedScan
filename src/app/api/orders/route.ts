import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const mine = searchParams.get('mine');
    
    if (employeeId) {
      // Get orders for specific employee
      const orders = await prisma.order.findMany({
        where: { employeeId },
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ orders });
    } else if (mine === '1') {
      // Get orders for the currently logged-in patient/user
      const cookieStore = await cookies();
      const userId = cookieStore.get('patient_session')?.value;
      if (!userId) {
        return NextResponse.json({ orders: [] });
      }
      const orders = await prisma.order.findMany({
        where: { customerUserId: userId },
        include: { items: true, employee: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ orders });
    } else {
      // Get all orders
      const orders = await prisma.order.findMany({
        include: { items: true, employee: true },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ orders });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, phone, address, medication, quantity, items, amountPaid } = body ?? {};
    
    if (!customerName || !phone || !address || !medication || !quantity) {
      return NextResponse.json({ error: 'customerName, phone, address, medication, quantity are required' }, { status: 400 });
    }

    // Find employee with matching location
    // Get all employees and find the best match
    const allEmployees = await prisma.employee.findMany();
    const employee = allEmployees.find(emp => 
      address.toLowerCase().includes(emp.location.toLowerCase()) ||
      emp.location.toLowerCase().includes(address.toLowerCase())
    );

    // Create order with employee assignment
    const cookieStore = await cookies();
    const userId = cookieStore.get('patient_session')?.value;
    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        address,
        medication,
        quantity,
        employeeId: employee?.id || null,
        customerUserId: userId || null,
        amountPaid: typeof amountPaid === 'number' ? amountPaid : undefined,
        items: items ? {
          create: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity
          }))
        } : undefined
      },
      include: { items: true, employee: true }
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}