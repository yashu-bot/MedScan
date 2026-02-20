"use client";

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientData } from '@/context/PatientDataContext';
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Calendar, FileText, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DoctorPatientDetailsPage() {
  const params = useParams();
  const doctorSlug = typeof params?.doctorSlug === 'string' ? params.doctorSlug : Array.isArray(params?.doctorSlug) ? params?.doctorSlug[0] : '';
  const patientId = typeof params?.patientId === 'string' ? params.patientId : Array.isArray(params?.patientId) ? params?.patientId[0] : '';
  const { getPatientById } = usePatientData();
  const { toast } = useToast();

  const patient = useMemo(() => getPatientById(patientId), [getPatientById, patientId]);
  const [note, setNote] = useState('');
  const [medicalNotes, setMedicalNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const doctorName = useMemo(() => {
    const words = doctorSlug.split('-').filter(Boolean);
    if (words.length === 0) return 'Doctor';
    const reconstructed = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return reconstructed.startsWith('Dr') ? reconstructed : `Dr ${reconstructed}`;
  }, [doctorSlug]);

  // Fetch medical notes from backend
  useEffect(() => {
    const fetchMedicalNotes = async () => {
      if (!patientId) return;
      
      setNotesLoading(true);
      try {
        const response = await fetch(`/api/patients/${patientId}/notes`);
        if (response.ok) {
          const data = await response.json();
          setMedicalNotes(data.notes || []);
        }
      } catch (error) {
        console.error('Error fetching medical notes:', error);
        toast({
          title: "Error",
          description: "Failed to load medical history",
          variant: "destructive"
        });
      } finally {
        setNotesLoading(false);
      }
    };

    fetchMedicalNotes();
  }, [patientId, toast]);

  const addMedicalNote = async () => {
    if (!note.trim() || !patientId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: note.trim(),
          doctorName: doctorName
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save note');
      }

      const newNote = await response.json();
      setMedicalNotes(prev => [newNote, ...prev]);
      setNote('');
      
      toast({
        title: "Success",
        description: "Medical note added successfully"
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save note",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!patient) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Patient not found</CardTitle>
            <CardDescription>The patient record could not be located.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/face-scan">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Face Scan
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{doctorName} • Patient Details</h1>
          <p className="text-muted-foreground">Comprehensive history and profile information</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/face-scan">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Face Scan
          </Link>
        </Button>
      </div>

      {/* Patient Information Card */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">{patient.name}</CardTitle>
              <CardDescription className="text-lg">
                Age {patient.age} • {patient.gender} • Blood Group {patient.bloodGroup}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Medical Information</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant={patient.allergies ? "destructive" : "secondary"}>
                  Allergies: {patient.allergies || 'None'}
                </Badge>
                <Badge variant="secondary">
                  Conditions: {patient.medicalConditions || 'None'}
                </Badge>
                {patient.recentSurgeries && (
                  <Badge variant="outline">Recent Surgeries: {patient.recentSurgeries}</Badge>
                )}
                {patient.implantedDevices && (
                  <Badge variant="outline">Implants: {patient.implantedDevices}</Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Emergency Contact</h4>
              <div className="text-sm">
                <strong>{patient.emergencyContactName}</strong><br />
                {patient.emergencyContactPhone}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical History Card */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Chronological medical notes and observations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display existing notes */}
          <div className="space-y-4">
            {notesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading medical history...</span>
              </div>
            ) : medicalNotes.length > 0 ? (
              <div className="space-y-3">
                {medicalNotes.map((note, idx) => (
                  <div key={note.id || idx} className="rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                      {note.doctorName && (
                        <Badge variant="outline" className="ml-auto">
                          {note.doctorName}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No medical history recorded yet.</p>
                <p className="text-sm">Add the first note below to start the patient's medical record.</p>
              </div>
            )}
          </div>

          {/* Add new note form */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Medical Note
            </h4>
            <div className="space-y-3">
              <Textarea 
                placeholder={`Enter medical observations, diagnosis, treatment plan, or notes for ${patient.name}...`}
                value={note} 
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  disabled={!note.trim() || loading} 
                  onClick={addMedicalNote}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Note
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





