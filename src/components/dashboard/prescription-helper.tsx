
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Loader2, Pilcrow, Pill, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { generatePrescription } from '@/ai/flows/prescription-helper-flow';
import type { PrescriptionHelperOutput } from '@/lib/schemas';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function PrescriptionHelper() {
  const [diagnosis, setDiagnosis] = useState('');
  const [generatedPrescription, setGeneratedPrescription] = useState<PrescriptionHelperOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderMedication, setOrderMedication] = useState('');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [isPlacing, setIsPlacing] = useState(false);
  const [pin, setPin] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Keep amountPaid in sync with selected medication's AI price and quantity
  useEffect(() => {
    const med = (generatedPrescription?.medications ?? []).find(m => m.name === orderMedication) as unknown as { price?: number } | undefined;
    const unit = typeof med?.price === 'number' ? Number(med!.price) : undefined;
    if (unit) {
      const total = Number((unit * (orderQuantity || 1)).toFixed(2));
      setAmountPaid(total);
    }
  }, [orderMedication, orderQuantity, generatedPrescription]);

  const handleGenerate = async () => {
    if (!diagnosis.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a diagnosis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedPrescription(null);

    try {
      const result = await generatePrescription({ diagnosis });
      setGeneratedPrescription(result);
      toast({
        title: "Prescription Draft Generated",
        description: "A draft has been created based on the diagnosis.",
      });
    } catch(error) {
        console.error("Prescription Generation Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Generation Failed",
          description: `Could not generate prescription: ${errorMessage}`,
          variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const openOrderForMedication = (medicationName: string) => {
    setOrderMedication(medicationName);
    setOrderQuantity(1);
    setOrderOpen(true);
    setPin('');
    setIsPaid(false);
    // Prefill amount if AI provided a unit price
    const med = (generatedPrescription?.medications ?? []).find(m => m.name === medicationName) as unknown as { price?: number } | undefined;
    const unit = typeof med?.price === 'number' ? med!.price : undefined;
    setAmountPaid(unit ? Number((unit * 1).toFixed(2)) : 0);
  };

  const handlePlaceOrder = async () => {
    // Validate common fields
    if (!orderName || !orderPhone || !orderAddress) {
      toast({ title: 'Missing details', description: 'Name, phone, and address are required.', variant: 'destructive' });
      return;
    }
    // Validate single item fields
    if (!orderMedication || !orderQuantity || Number.isNaN(Number(orderQuantity)) || Number(orderQuantity) < 1) {
      toast({ title: 'Missing details', description: 'Medication and quantity ≥ 1 are required.', variant: 'destructive' });
      return;
    }
    // Require demo payment if we have a unit price (simulate Razorpay)
    const selectedMed = (generatedPrescription?.medications ?? []).find(m => m.name === orderMedication) as unknown as { price?: number } | undefined;
    const unitPrice = typeof selectedMed?.price === 'number' ? selectedMed!.price : undefined;
    if (unitPrice && !isPaid) {
      toast({ title: 'Payment required', description: 'Please complete payment before placing the order.', variant: 'destructive' });
      return;
    }
    // Compute amount strictly from AI price * quantity
    if (!unitPrice) {
      toast({ title: 'Price unavailable', description: 'AI did not return a price for this medication.', variant: 'destructive' });
      return;
    }
    const computedAmount = Number((Number(unitPrice) * orderQuantity).toFixed(2));
    setIsPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: orderName,
          phone: orderPhone,
          address: orderAddress,
          medication: orderMedication,
          quantity: orderQuantity,
          amountPaid: computedAmount,
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Order creation failed (${res.status})`);
      }
      const created = await res.json();
      // Generate simple bill (PDF)
      try {
        const doc = new jsPDF();
        const now = new Date();
        doc.setFontSize(18);
        doc.text('MedScan360 - Order Bill', 14, 18);
        doc.setFontSize(11);
        doc.text(`Date: ${now.toLocaleString()}`, 14, 26);
        doc.text(`Order ID: ${created?.order?.id ?? 'N/A'}`, 14, 32);
        doc.line(14, 36, 196, 36);

        let y = 46;
        doc.setFontSize(13);
        doc.text('Customer Details', 14, y); y += 6;
        doc.setFontSize(11);
        doc.text(`Name: ${orderName}`, 14, y); y += 6;
        doc.text(`Phone: ${orderPhone}`, 14, y); y += 6;
        doc.text(`Address: ${orderAddress}`, 14, y); y += 10;

        doc.setFontSize(13);
        doc.text('Order Items', 14, y); y += 6;
        doc.setFontSize(11);
        doc.text(`Medication: ${orderMedication}`, 14, y); y += 6;
        doc.text(`Quantity: ${orderQuantity}`, 14, y); y += 6;
        doc.text(`Amount Paid: ${Number(amountPaid).toFixed(2)}`, 14, y); y += 10;

        doc.setFontSize(12);
        doc.text('Thank you for your order!', 14, y);

        doc.save(`bill-${created?.order?.id ?? 'order'}.pdf`);
      } catch {}

      toast({ title: 'Order placed', description: 'Bill generated and downloaded.' });
      setOrderOpen(false);
      setOrderName(''); setOrderPhone(''); setOrderAddress(''); setOrderMedication(''); setOrderQuantity(1);
      setPin(''); setIsPaid(false); setIsPaying(false); setAmountPaid(0);
    } catch (e) {
      toast({ title: 'Order failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleDemoPay = () => {
    const med = (generatedPrescription?.medications ?? []).find(m => m.name === orderMedication) as unknown as { price?: number } | undefined;
    const unit = typeof med?.price === 'number' ? med!.price : undefined;
    if (!unit) {
      toast({ title: 'No price available', description: 'This item has no price set by AI.', variant: 'destructive' });
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast({ title: 'Invalid PIN', description: 'Enter a 4-digit PIN (demo).', variant: 'destructive' });
      return;
    }
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setIsPaid(true);
      toast({ title: 'Payment successful', description: 'Demo Razorpay payment authorized.' });
    }, 800);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>AI Prescription Helper</CardTitle>
        <CardDescription>
          Enter a diagnosis to get an AI-generated draft of a potential prescription and advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="e.g., 'Acute Bronchitis'"
            value={ diagnosis }
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Pilcrow className="mr-2 h-4 w-4" />
              Generate Prescription Draft
            </>
          )}
        </Button>
        {generatedPrescription && (
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-xl font-bold text-primary">Generated Draft</h3>
            
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Pill className="h-5 w-5 text-primary"/>Medication Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {(generatedPrescription?.medications ?? []).map((med, index) => (
                            <li key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-2 rounded-md bg-muted/50">
                                <div className="flex flex-col">
                                  <span className="font-semibold">{med.name}</span>
                                  <span className="text-muted-foreground">{med.dosage}, {med.frequency}</span>
                                  {typeof (med as any).price === 'number' && (
                                    <span className="text-xs text-muted-foreground">Unit price: {(med as any).price}</span>
                                  )}
                                </div>
                                <Button size="sm" onClick={() => openOrderForMedication(med.name)}>Place Order</Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>General Advice</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="list-disc list-inside space-y-2">
                        {(generatedPrescription?.advice ?? []).map((adv, index) => (
                            <li key={index}>{adv}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            
            <Separator />

             <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-sm flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="whitespace-pre-wrap">{generatedPrescription.disclaimer}</p>
            </div>
            <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Place Order</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="orderName">Name</Label>
                    <Input id="orderName" value={orderName} onChange={(e) => setOrderName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="orderPhone">Phone Number</Label>
                    <Input id="orderPhone" value={orderPhone} onChange={(e) => setOrderPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="orderAddress">Address</Label>
                    <Textarea id="orderAddress" value={orderAddress} onChange={(e) => setOrderAddress(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="orderMedication">Medication</Label>
                    <Input id="orderMedication" value={orderMedication} onChange={(e) => setOrderMedication(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="orderQuantity">Quantity</Label>
                    <Input id="orderQuantity" type="number" min={1} value={orderQuantity} onChange={(e) => setOrderQuantity(parseInt(e.target.value || '1', 10))} />
                  </div>
                  {(() => {
                    const med = (generatedPrescription?.medications ?? []).find(m => m.name === orderMedication);
                    const unit = typeof (med as any)?.price === 'number' ? Number((med as any).price) : undefined;
                    const total = unit && orderQuantity ? Number((unit * orderQuantity).toFixed(2)) : undefined;
                    return unit ? (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">Estimated total: {total}</div>
                        {!isPaid ? (
                          <div className="grid gap-2">
                            <Label htmlFor="pin">Razorpay PIN (demo)</Label>
                            <div className="flex items-center gap-2">
                              <Input id="pin" type="password" inputMode="numeric" placeholder="XXXX" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0,4))} className="w-28" />
                              <Button type="button" variant="default" onClick={handleDemoPay} disabled={isPaying}>
                                {isPaying ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Paying...
                                  </>
                                ) : 'Pay'}
                              </Button>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="amountPaid">Amount Paid</Label>
                              <Input id="amountPaid" type="number" min={0} step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value || '0'))} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm">Payment successful</span>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                  {(() => {
                    const med = (generatedPrescription?.medications ?? []).find(m => m.name === orderMedication);
                    const unit = typeof (med as any)?.price === 'number' ? Number((med as any).price) : undefined;
                    if (!unit) {
                      return (
                        <div className="grid gap-2">
                          <Label htmlFor="amountPaid">Amount Paid</Label>
                          <Input id="amountPaid" type="number" min={0} step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value || '0'))} />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setOrderOpen(false)} disabled={isPlacing}>Cancel</Button>
                  <Button onClick={handlePlaceOrder} disabled={isPlacing || (!!(generatedPrescription?.medications ?? []).find(m => m.name === orderMedication && typeof (m as any).price === 'number') && !isPaid)}>
                    {isPlacing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing...
                      </>
                    ) : 'Place Order'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
