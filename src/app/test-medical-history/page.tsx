"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function TestMedicalHistoryPage() {
  const [patientId, setPatientId] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Test');
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addNote = async () => {
    if (!patientId || !noteContent) {
      toast({
        title: "Error",
        description: "Please enter patient ID and note content",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: noteContent,
          doctorName: doctorName
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save note');
      }

      const newNote = await response.json();
      toast({
        title: "Success",
        description: "Medical note saved successfully"
      });
      
      setNoteContent('');
      fetchNotes(); // Refresh the notes list
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

  const fetchNotes = async () => {
    if (!patientId) return;

    try {
      const response = await fetch(`/api/patients/${patientId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test Medical History</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Note Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Medical Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
              />
            </div>
            
            <div>
              <Label htmlFor="doctorName">Doctor Name</Label>
              <Input
                id="doctorName"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Enter doctor name"
              />
            </div>
            
            <div>
              <Label htmlFor="noteContent">Note Content</Label>
              <Textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter medical note content"
                rows={4}
              />
            </div>
            
            <Button onClick={addNote} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Note'}
            </Button>
          </CardContent>
        </Card>

        {/* View Notes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Medical Notes</CardTitle>
              <Button onClick={fetchNotes} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <p className="text-muted-foreground">No notes found for this patient</p>
            ) : (
              <div className="space-y-4">
                {notes.map((note, index) => (
                  <div key={note.id || index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-primary">
                        {note.doctorName || 'Unknown Doctor'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




