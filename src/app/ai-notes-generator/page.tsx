"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, User, TestTube, ClipboardList, FlaskConical, Save, Download, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateNote } from '@/ai/flows/notes-generator-flow';
import type { NoteGeneratorOutput } from '@/lib/schemas';
import { useParams } from 'next/navigation';

export default function AINotesGeneratorPage() {
  const [keywords, setKeywords] = useState('');
  const [patientName, setPatientName] = useState('');
  const [generatedNote, setGeneratedNote] = useState<NoteGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  
  // Extract doctor name from URL params
  const doctorSlug = typeof params?.doctorSlug === 'string' ? params.doctorSlug : '';
  const doctorName = doctorSlug ? doctorSlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') : 'Dr. System';

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some keywords or phrases.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGeneratedNote(null);

    try {
      const result = await generateNote({ keywords });
      setGeneratedNote(result);
      toast({
        title: "Note Generated",
        description: "A draft of the doctor's note has been created.",
      });
    } catch(error) {
      console.error("Note Generation Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Generation Failed",
        description: `Could not generate note: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = () => {
    if (!generatedNote) return;
    
    const fullNoteContent = `Patient: ${patientName || 'Unknown Patient'}\nDoctor: ${doctorName}\nDate: ${new Date().toLocaleDateString()}\n\nSUBJECTIVE: ${generatedNote.subjective}\nOBJECTIVE: ${generatedNote.objective}\nASSESSMENT: ${generatedNote.assessment}\nPLAN: ${generatedNote.plan}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(fullNoteContent);
    toast({
      title: "Note Copied",
      description: "The clinical note has been copied to your clipboard."
    });
  };

  const handleDownloadNote = () => {
    if (!generatedNote) return;
    
    const fullNoteContent = `Patient: ${patientName || 'Unknown Patient'}\nDoctor: ${doctorName}\nDate: ${new Date().toLocaleDateString()}\n\nSUBJECTIVE: ${generatedNote.subjective}\nOBJECTIVE: ${generatedNote.objective}\nASSESSMENT: ${generatedNote.assessment}\nPLAN: ${generatedNote.plan}`;
    
    const blob = new Blob([fullNoteContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-note-${patientName || 'patient'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Note Downloaded",
      description: "The clinical note has been downloaded."
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wand2 className="h-8 w-8 text-primary" />
          AI Clinical Notes Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate structured SOAP notes from consultation keywords - {doctorName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Consultation Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name (Optional)</Label>
              <Input
                id="patientName"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Consultation Keywords</Label>
              <Textarea
                id="keywords"
                placeholder="e.g., 'patient complains of headache for 2 days, sensitivity to light, no fever, prescribed rest and hydration'"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={6}
                disabled={isLoading}
                className="resize-none"
              />
            </div>
            
            {/* Quick Template Buttons */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Templates:</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKeywords("headache for 2 days, photophobia, no fever, normal vitals, prescribed ibuprofen 400mg TID, follow up in 1 week")}
                  disabled={isLoading}
                >
                  Headache
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKeywords("chest pain, shortness of breath, EKG normal, referred to cardiology for stress test, follow up in 2 weeks")}
                  disabled={isLoading}
                >
                  Chest Pain
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKeywords("diabetes follow-up, HbA1c 7.2%, blood pressure controlled, adjusted metformin to 1000mg BID, lifestyle counseling")}
                  disabled={isLoading}
                >
                  Diabetes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKeywords("upper respiratory infection, cough, congestion, no fever, prescribed rest, fluids, follow up if worsening")}
                  disabled={isLoading}
                >
                  URI
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading || !keywords.trim()} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Clinical Note...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate SOAP Note
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Generated Clinical Note</CardTitle>
          </CardHeader>
          <CardContent>
            {!generatedNote ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter consultation keywords and click "Generate SOAP Note" to create a structured clinical note.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleSaveNote} size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button onClick={handleDownloadNote} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <NoteSection icon={User} title="Subjective" content={generatedNote.subjective} />
                  <NoteSection icon={TestTube} title="Objective" content={generatedNote.objective} />
                  <NoteSection icon={ClipboardList} title="Assessment" content={generatedNote.assessment} />
                  <NoteSection icon={FlaskConical} title="Plan" content={generatedNote.plan} />
                </div>

                <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-sm flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p>{generatedNote.disclaimer}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface NoteSectionProps {
  icon: React.ElementType;
  title: string;
  content: string;
}

const NoteSection: React.FC<NoteSectionProps> = ({ icon: Icon, title, content }) => (
  <Card className="bg-muted/30">
    <CardHeader className="p-4">
      <CardTitle className="text-lg flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <p className="whitespace-pre-wrap">{content}</p>
    </CardContent>
  </Card>
);

