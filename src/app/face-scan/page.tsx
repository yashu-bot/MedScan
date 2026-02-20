
"use client";

import { useEffect, useMemo, useState } from 'react';
import WebcamCapture from '@/components/core/webcam-capture';
import EmergencyDisplay from '@/components/core/emergency-display';
import { type PatientData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ScanFace, ServerCrash, UserCheck, UserX, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePatientData } from '@/context/PatientDataContext';
import { recognizeFace } from '@/ai/flows/face-recognition-flow';

export default function FaceScanPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [scanStep, setScanStep] = useState<'initial' | 'capturing' | 'processing' | 'result'>('initial');
  const { toast } = useToast();
  const { patients: contextPatients } = usePatientData();
  const [backendPatients, setBackendPatients] = useState<PatientData[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDoctorSlug, setSelectedDoctorSlug] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/patients', { cache: 'no-store' });
        const j = res.ok ? await res.json() : { patients: [] };
        // Map backend fields to PatientData shape minimally required by recognizeFace/EmergencyDisplay
        const mapped: PatientData[] = (j.patients || []).map((p: any) => ({
          id: p.userId,
          name: p.name,
          age: p.age,
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          allergies: p.allergies || '',
          medicalConditions: p.medicalConditions || '',
          recentSurgeries: p.recentSurgeries || '',
          implantedDevices: p.implantedDevices || '',
          emergencyContactName: p.emergencyContactName,
          emergencyContactPhone: p.emergencyContactPhone,
          faceImageUrl: p.faceImageUrl || '',
        }));
        setBackendPatients(mapped);
      } catch {
        setBackendPatients([]);
      }
    })();
  }, []);

  // Load doctors for selector and set default from query if present
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/doctors', { cache: 'no-store' });
        const j = await r.json();
        const list = (j.doctors || []).map((d: any) => ({ id: d.id, name: d.name }));
        setDoctors(list);
      } catch {}
    })();
    const qsDoctor = searchParams.get('doctor') || '';
    setSelectedDoctorSlug(qsDoctor);
  }, [searchParams]);

  const availablePatients: PatientData[] = useMemo(() => {
    const map = new Map<string, PatientData>();
    for (const p of backendPatients) { if (p && p.id) map.set(p.id, p); }
    for (const p of (contextPatients || [])) { if (p && p.id) map.set(p.id, p); }
    return Array.from(map.values());
  }, [backendPatients, contextPatients]);

  const handleStartScan = () => {
    setScanStep('capturing');
  }

  const handleCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setScanStep('processing');
    setIsLoading(true);
    setPatientData(null);
    setScanError(null);
    setNoMatchFound(false);

    try {
       // Call the new AI flow
      const result = await recognizeFace({ 
        capturedPhotoDataUri: imageSrc, 
        registeredPatients: availablePatients 
      });

      if (result.matchFound) {
        setPatientData(result.patient);
        toast({
          title: "Patient Identified",
          description: `${result.patient!.name} recognized.`,
          variant: "default",
        });
        // No auto-send; doctor can send using the button below.
      } else {
        setNoMatchFound(true);
        toast({
          title: "No Match",
          description: "The scanned face did not match any registered patient records.",
          variant: "default",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during face scan.";
      setScanError(errorMessage);
      toast({
        title: "Scan Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setScanStep('result');
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setPatientData(null);
    setIsLoading(false);
    setScanError(null);
    setNoMatchFound(false);
    setScanStep('initial');
  };

  const renderContent = () => {
    switch (scanStep) {
      case 'initial':
        return (
          <div className="text-center p-4">
             {availablePatients.length > 0 ? (
              <>
                <p className="mb-4">Click the button below to start the camera and scan for a patient's face.</p>
                <Button onClick={handleStartScan} size="lg">
                  <ScanFace className="mr-2 h-5 w-5" /> Start Face Scan
                </Button>
              </>
            ) : (
              <div className="p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-center space-y-3">
                 <UserX className="h-10 w-10 mx-auto mb-2 text-yellow-600 dark:text-yellow-500" />
                  <p className="text-xl font-semibold">No Patients Registered</p>
                  <p>Please register a patient first to use the face scan feature.</p>
              </div>
            )}
          </div>
        );
      case 'capturing':
        return <WebcamCapture onCapture={handleCapture} onCancel={resetScan} captureButtonText="Scan Face" cancelButtonText='Cancel Scan'/>;
      
      case 'processing':
         return (
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-md min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg font-medium text-foreground">Scanning and Identifying...</p>
              <p className="text-sm text-muted-foreground">Comparing against registered patient photos.</p>
               {capturedImage && (
                <Image 
                    src={capturedImage} 
                    alt="Captured face" 
                    width={100} 
                    height={100} 
                    className="rounded-md border mt-4 shadow-md opacity-50" 
                />
              )}
            </div>
          );

      case 'result':
        return (
          <div className='space-y-4'>
            {scanError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center space-y-3">
                <ServerCrash className="h-10 w-10 mx-auto mb-2" />
                <p className="text-xl font-semibold">Scan Failed</p>
                <p>{scanError}</p>
              </div>
            )}
            
            {noMatchFound && !patientData && !scanError && (
              <div className="p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-center space-y-3">
                  <UserX className="h-10 w-10 mx-auto mb-2 text-yellow-600 dark:text-yellow-500" />
                  <p className="text-xl font-semibold">No Match Found</p>
                  <p>The scanned image did not match any patient in our records.</p>
              </div>
            )}

            {patientData && (
              <div className="p-4 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md text-center space-y-3">
                <UserCheck className="h-10 w-10 mx-auto mb-2 text-green-600 dark:text-green-500" />
                <p className="text-xl font-semibold">Patient Identified!</p>
                <EmergencyDisplay patient={patientData} />
                <div className="space-y-2">
                  {/* Doctor selection shown if query param missing */}
                  {!selectedDoctorSlug && (
                    <div className="text-left">
                      <label className="text-xs text-muted-foreground">Select Doctor to Notify</label>
                      <Select value={selectedDoctorSlug} onValueChange={setSelectedDoctorSlug}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder={doctors.length ? 'Choose doctor' : 'Loading…'} />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={async () => {
                      const doctorSlug = selectedDoctorSlug || searchParams.get('doctor') || '';
                      if (!doctorSlug) {
                        toast({ title: 'Select a doctor', description: 'Please choose a doctor to send the alert.', variant: 'destructive' });
                        return;
                      }
                      try {
                        const res = await fetch('/api/notifications/emergency', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            patientId: patientData.id,
                            doctorSlug,
                            patientName: patientData.name,
                            emergencyContactDetails: { name: patientData.emergencyContactName, phone: patientData.emergencyContactPhone }
                          })
                        });
                        if (res.ok) {
                          toast({ title: 'Notification sent', description: 'Emergency alert delivered to doctor.' });
                        } else {
                          const j = await res.json().catch(() => ({}));
                          toast({ title: 'Failed to send', description: j?.error || 'Unknown error', variant: 'destructive' });
                        }
                      } catch (e) {
                        toast({ title: 'Network error', description: 'Could not send notification.', variant: 'destructive' });
                      }
                    }}
                  >
                    Send Notification to Doctor
                  </Button>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      const doctorSlug = searchParams.get('doctor') || 'dr-general';
                      router.push(`/doctors/${doctorSlug}/patients/${patientData.id}`);
                    }}
                  >
                    View Full Details & Medical History
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.push(`/emergency-form/${patientData.id}`)}
                  >
                    Emergency Admission Form
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={resetScan} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Scan Another Face
            </Button>
          </div>
        );

      default:
        return null;
    }
  }


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('/images/backgrounds/face-scan-bg.jpg')`
        }}
      />
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-black/40" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto py-8">
        <Card className="max-w-2xl mx-auto shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <ScanFace className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Emergency Face Scan
              </CardTitle>
            </div>
            <CardDescription className="text-md">
              Use the webcam to capture a facial image for patient identification against registered records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
