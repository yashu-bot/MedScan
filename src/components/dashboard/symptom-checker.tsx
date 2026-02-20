
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeSymptoms } from '@/ai/flows/symptom-checker-flow';
import type { SymptomAnalysisOutput } from '@/lib/schemas';

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Symptoms Required",
        description: "Please enter the patient's symptoms.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
        const result = await analyzeSymptoms({ 
            symptoms, 
        });
        setAnalysisResult(result);
        toast({
          title: "Analysis Complete",
          description: "Preliminary analysis has been generated.",
        });
    } catch(error) {
        console.error("Symptom Analysis Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Analysis Failed",
          description: `Could not get analysis: ${errorMessage}`,
          variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>AI Symptom Checker</CardTitle>
        <CardDescription>
          Enter patient symptoms to get a preliminary AI-powered analysis and recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <label htmlFor="symptoms" className="text-sm font-medium">Patient Symptoms</label>
            <Textarea
              id="symptoms"
              placeholder="e.g., 'Patient reports high fever, persistent dry cough, and shortness of breath for the last 3 days.'"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
        </div>
        <Button onClick={handleAnalyze} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Stethoscope className="mr-2 h-4 w-4" />
              Analyze Symptoms
            </>
          )}
        </Button>
        {analysisResult && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Symptom Analysis:</h4>
            <div className="p-4 bg-muted/50 rounded-md border text-sm whitespace-pre-wrap">
              {analysisResult.analysis}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
