"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function PatientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/orders?mine=1', { cache: 'no-store' });
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Your Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div>No orders found for your account.</div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="p-3 bg-background rounded border">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-sm">{o.delivered ? 'Delivered' : 'Pending'}</div>
                  </div>
                  <div className="text-sm mt-2">
                    <div><strong>Address:</strong> {o.address}</div>
                    <div><strong>Medication:</strong> {o.medication} (Qty: {o.quantity})</div>
                    {o.items?.length > 0 && (
                      <ul className="ml-5 list-disc">
                        {o.items.map((it, idx) => (
                          <li key={idx}>{it.name} (Qty: {it.quantity})</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


