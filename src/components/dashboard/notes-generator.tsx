
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, AlertTriangle, User, TestTube,ClipboardList, FlaskConical, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateNote } from '@/ai/flows/notes-generator-flow';
import type { NoteGeneratorOutput } from '@/lib/schemas';
import { usePatientData } from '@/context/PatientDataContext';

interface NotesGeneratorProps {
    patientId: string;
    onNoteSaved: () => void;
}

export default function NotesGenerator({ patientId, onNoteSaved }: NotesGeneratorProps) {
  const [keywords, setKeywords] = useState('');
  const [generatedNote, setGeneratedNote] = useState<NoteGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addNoteToPatientHistory } = usePatientData();

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

    const fullNoteContent = `SUBJECTIVE: ${generatedNote.subjective}\nOBJECTIVE: ${generatedNote.objective}\nASSESSMENT: ${generatedNote.assessment}\nPLAN: ${generatedNote.plan}`;

    addNoteToPatientHistory(patientId, fullNoteContent);

    toast({
        title: "Note Saved",
        description: "The clinical note has been added to the patient's history."
    });
    setGeneratedNote(null);
    setKeywords('');
    onNoteSaved(); // Notify parent to close the component
  }

  return (
    <Card className="shadow-md border-primary border">
      <CardContent className="space-y-4 p-4">
        <div>
          <Textarea
            placeholder="e.g., 'headache for 2 days, sensitivity to light, no fever'"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            rows={3}
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
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Note
            </>
          )}
        </Button>
        {generatedNote && (
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-xl font-bold text-primary">Generated S.O.A.P. Note</h3>
            <NoteSection icon={User} title="Subjective" content={generatedNote.subjective} />
            <NoteSection icon={TestTube} title="Objective" content={generatedNote.objective} />
            <NoteSection icon={ClipboardList} title="Assessment" content={generatedNote.assessment} />
            <NoteSection icon={FlaskConical} title="Plan" content={generatedNote.plan} />

            <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-sm flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>{generatedNote.disclaimer}</p>
            </div>
            <Button onClick={handleSaveNote} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Save Note to Patient History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
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
