"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Phone, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  medication: string;
  quantity: number;
  createdAt: string;
  delivered: boolean;
  items: Array<{ name: string; quantity: number }>;
}

export default function OrdersPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const employeeParam = searchParams.get('employee');
    if (employeeParam) {
      setUsername(employeeParam);
    }
  }, [searchParams]);

  const loadOrders = async (employeeId: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?employeeId=${employeeId}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await res.json();
      setEmployee(data.employee);
      setIsLoggedIn(true);
      await loadOrders(data.employee.id);
      toast({ title: 'Success', description: `Welcome ${data.employee.name}` });
    } catch (e) {
      toast({ title: 'Error', description: 'Invalid username or password', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivered: true })
      });
      
      if (!res.ok) throw new Error('Failed to update order');
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, delivered: true } : order
      ));
      
      toast({ title: 'Success', description: 'Order marked as delivered' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCallCustomer = (phone: string, customerName: string) => {
    // Demo call functionality
    toast({ 
      title: 'Demo Call', 
      description: `Calling ${customerName} at ${phone}... This is a demo call.` 
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmployee(null);
    setOrders([]);
    setUsername('');
    setPassword('');
  };

  if (isLoggedIn && employee) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Employee Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome, {employee.name} ({employee.location})
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Employee Information</h3>
                <p><strong>Name:</strong> {employee.name}</p>
                <p><strong>Username:</strong> {employee.username}</p>
                <p><strong>Location:</strong> {employee.location}</p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Assigned Orders</h3>
                {loadingOrders ? (
                  <div>Loading orders...</div>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders assigned to your location yet.</p>
                ) : (
                  <div className="space-y-3 mt-3">
                    {orders.map((order) => (
                      <div key={order.id} className="p-3 bg-background rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{order.customerName}</h4>
                            <p className="text-sm text-muted-foreground">{order.address}</p>
                          </div>
                          <Badge variant={order.delivered ? "default" : "secondary"}>
                            {order.delivered ? "Delivered" : "Pending"}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <p><strong>Phone:</strong> {order.phone}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallCustomer(order.phone, order.customerName)}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </Button>
                          </div>
                          <p><strong>Medication:</strong> {order.medication} (Qty: {order.quantity})</p>
                          <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                          {order.items.length > 0 && (
                            <div>
                              <strong>Items:</strong>
                              <ul className="ml-4">
                                {order.items.map((item, idx) => (
                                  <li key={idx}>• {item.name} (Qty: {item.quantity})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!order.delivered && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                onClick={() => handleMarkDelivered(order.id)}
                                disabled={updatingOrder === order.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {updatingOrder === order.id ? 'Updating...' : 'Mark as Delivered'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Employee Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use your employee credentials to access your dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="username">Username</label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password">Password</label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}