
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePatientData } from '@/context/PatientDataContext';
import { type PatientData, type OpdSlipData } from '@/lib/schemas';
import { generateOpdSlip } from '@/ai/flows/opd-slip-flow'; 
import OpdSlipComponent from '@/components/core/opd-slip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Ticket, ArrowLeft, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function OpdSlipGeneratorPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  
  const { getPatientById } = usePatientData();
  const { toast } = useToast();

  const [patient, setPatient] = useState<PatientData | null | undefined>(undefined);
  const [generatedSlip, setGeneratedSlip] = useState<OpdSlipData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      const foundPatient = getPatientById(patientId);
      setPatient(foundPatient || null);
    }
  }, [patientId, getPatientById]);

  const handleGenerateSlip = async () => {
    if (!patient) {
      toast({ title: "Error", description: "Patient data not available.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedSlip(null);

    try {
      const inputPatientData = {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender as 'male' | 'female' | 'other',
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        medicalConditions: patient.medicalConditions,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        facialImagePreview: patient.faceImageUrl,
      };

      const slip = await generateOpdSlip({ patient: inputPatientData });
      setGeneratedSlip(slip);
      toast({
        title: "OPD Slip Generated",
        description: `Token: ${slip.tokenNumber} for ${slip.patientName} has been generated.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate OPD slip.";
      setError(errorMessage);
      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
      console.error("OPD Slip Generation Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (patient === undefined) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (patient === null) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-destructive" />
            <CardTitle className="text-2xl text-destructive">Patient Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not retrieve data for patient ID: {patientId}.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
       <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      <Card className="max-w-lg mx-auto shadow-lg">
        <CardHeader className="text-center">
          <Ticket className="h-10 w-10 mx-auto mb-3 text-primary" />
          <CardTitle className="text-3xl">OPD Slip Generator</CardTitle>
          <CardDescription>
            Generate an Outpatient Department slip for <strong>{patient.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {!generatedSlip && (
            <Button onClick={handleGenerateSlip} disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate New OPD Slip"
              )}
            </Button>
          )}
          {error && <p className="mt-4 text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {generatedSlip && (
        <>
          <OpdSlipComponent slip={generatedSlip} />
          <div className="text-center mt-6">
             <Button onClick={handleGenerateSlip} disabled={isLoading} variant="outline">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Generate Another Slip for this Patient"
              )}
            </Button>
          </div>
           <Card className="mt-6 max-w-lg mx-auto bg-amber-50 border border-amber-300 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <CardContent className="p-4">
                <div className="flex items-start">
                    <Info className="h-5 w-5 mr-3 mt-1 text-amber-500 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">Backend Integration Note</h4>
                        <p className="text-sm">
                           This OPD slip has been generated but is **not yet saved to Firebase**. The Genkit flow `opd-slip-flow.ts` contains placeholders for database integration. You'll need to implement the Firebase Admin SDK calls there to persist the slip data.
                        </p>
                    </div>
                </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
