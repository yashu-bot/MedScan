
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookText, AlertTriangle, ListChecks, Stethoscope, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { summarizeReport } from '@/ai/flows/report-summarizer-flow';
import type { ReportSummarizerOutput } from '@/lib/schemas';

export default function ReportSummarizer() {
  const [reportText, setReportText] = useState('');
  const [summary, setSummary] = useState<ReportSummarizerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!reportText.trim()) {
      toast({
        title: "Input Required",
        description: "Please paste or enter a medical report to summarize.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary(null);

    try {
      const result = await summarizeReport({ reportText });
      setSummary(result);
      toast({
        title: "Summary Generated",
        description: "The medical report has been summarized.",
      });
    } catch(error) {
      console.error("Report Summarization Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Summarization Failed",
        description: `Could not summarize report: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>AI Medical Report Summarizer</CardTitle>
        <CardDescription>
          Paste a lengthy medical report below, and the AI will generate a concise, patient-friendly summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="Paste the full medical report text here..."
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={10}
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleSummarize} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <BookText className="mr-2 h-4 w-4" />
              Summarize Report
            </>
          )}
        </Button>
        {summary && (
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-xl font-bold text-primary">Your Report Summary</h3>
            
            <SummarySection icon={ListChecks} title="Key Findings" items={summary.keyFindings} />
            
            <Card className="bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        What It Means (Diagnosis)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{summary.diagnosis}</p>
                </CardContent>
            </Card>

            <SummarySection icon={Lightbulb} title="What's Next (Recommendations)" items={summary.recommendations} />
            
            <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-sm flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>{summary.disclaimer}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SummarySectionProps {
    icon: React.ElementType;
    title: string;
    items: string[];
}

const SummarySection: React.FC<SummarySectionProps> = ({ icon: Icon, title, items }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-1">
                {items.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </CardContent>
    </Card>
);
