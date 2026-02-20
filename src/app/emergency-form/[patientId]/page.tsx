
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EmergencyAdmissionForm } from '@/components/forms/emergency-admission-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type PatientData } from '@/lib/schemas';
import { usePatientData } from '@/context/PatientDataContext'; // Import the context hook
import { FileText, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EmergencyFormPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const { getPatientById } = usePatientData(); // Get function from context

  const [patientData, setPatientData] = useState<PatientData | null | undefined>(undefined); // undefined for loading, null for not found

  useEffect(() => {
    if (patientId) {
      const foundPatient = getPatientById(patientId);
      setPatientData(foundPatient || null); // Set to null if not found
    }
  }, [patientId, getPatientById]);

  if (patientData === undefined) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading patient data...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
            <CardTitle className="text-2xl text-destructive">Patient Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not retrieve data for patient ID: {patientId}. The patient may not be registered in the current session.</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Emergency Admission Form</CardTitle>
          </div>
          <CardDescription className="text-md">
            Confirm or edit patient details and complete the admission/consent form for <strong>{patientData.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmergencyAdmissionForm patientData={patientData} />
        </CardContent>
      </Card>
    </div>
  );
}
