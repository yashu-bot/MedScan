"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Employee { 
  id: string; 
  name: string; 
  username: string; 
  location: string;
  deliveredCount?: number;
}

export default function EmployeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      const data = await res.json();
      const employeesData = data.employees || [];
      
      // Load delivered counts for each employee
      const employeesWithCounts = await Promise.all(
        employeesData.map(async (emp: Employee) => {
          try {
            const ordersRes = await fetch(`/api/orders?employeeId=${emp.id}`);
            const ordersData = await ordersRes.json();
            const deliveredCount = ordersData.orders?.filter((order: any) => order.delivered).length || 0;
            return { ...emp, deliveredCount };
          } catch {
            return { ...emp, deliveredCount: 0 };
          }
        })
      );
      
      setEmployees(employeesWithCounts);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load employees', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowDelivered = async (employee: Employee) => {
    setSelectedEmployee(employee);
    try {
      const res = await fetch(`/api/orders?employeeId=${employee.id}`);
      const data = await res.json();
      const delivered = data.orders?.filter((order: any) => order.delivered) || [];
      setDeliveredOrders(delivered);
      setShowDeliveredModal(true);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load delivered orders', variant: 'destructive' });
    }
  };

  const addEmployee = async () => {
    if (!name.trim() || !username.trim() || !password.trim() || !location.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password: password.trim(), location: location.trim() })
      });
      if (!res.ok) throw new Error('Failed to add employee');
      await loadEmployees();
      setName(''); setUsername(''); setPassword(''); setLocation('');
      setShowForm(false);
      toast({ title: 'Success', description: 'Employee added successfully' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add employee', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowForm(true)}>Add Employee</Button>
          {showForm && (
            <div className="grid gap-3 mt-4 md:grid-cols-4">
              <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
              <div className="md:col-span-4">
                <Button onClick={addEmployee} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
          <div className="mt-6">
            <h3 className="font-medium mb-2">Employee List</h3>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <ul className="text-sm list-disc pl-5">
                {employees.length === 0 ? (
                  <li>No employees added</li>
                ) : (
                  employees.map((e) => (
                    <li key={e.id} className="flex items-center justify-between">
                      <span>{e.name} — {e.location}</span>
                      {e.deliveredCount && e.deliveredCount > 0 && (
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => handleShowDelivered(e)}
                        >
                          {e.deliveredCount} delivered
                        </Badge>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivered Orders Modal */}
      {showDeliveredModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Delivered Orders - {selectedEmployee.name}</CardTitle>
                <Button variant="outline" onClick={() => setShowDeliveredModal(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deliveredOrders.length === 0 ? (
                <p className="text-muted-foreground">No delivered orders found.</p>
              ) : (
                <div className="space-y-3">
                  {deliveredOrders.map((order) => (
                    <div key={order.id} className="p-3 bg-muted rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{order.customerName}</h4>
                        <Badge variant="default">Delivered</Badge>
                      </div>
                      <div className="text-sm">
                        <p><strong>Address:</strong> {order.address}</p>
                        <p><strong>Phone:</strong> {order.phone}</p>
                        <p><strong>Medication:</strong> {order.medication} (Qty: {order.quantity})</p>
                        <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                        {order.items.length > 0 && (
                          <div>
                            <strong>Items:</strong>
                            <ul className="ml-4">
                              {order.items.map((item: any, idx: number) => (
                                <li key={idx}>• {item.name} (Qty: {item.quantity})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


