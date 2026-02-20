
'use server';
/**
 * @fileOverview A Genkit flow for summarizing medical reports.
 *
 * This file defines a Genkit flow that takes the full text of a medical report
 * and generates a concise, patient-friendly summary.
 *
 * - summarizeReport - The primary exported function to be called from the client.
 */

import { ai } from '@/ai/genkit';
import { 
    ReportSummarizerInputSchema, 
    ReportSummarizerOutputSchema,
    type ReportSummarizerInput,
    type ReportSummarizerOutput 
} from '@/lib/schemas';

// Exported function to be called from the frontend
export async function summarizeReport(input: ReportSummarizerInput): Promise<ReportSummarizerOutput> {
  return reportSummarizerFlow(input);
}

const reportSummarizerPrompt = ai.definePrompt(
  {
    name: 'reportSummarizerPrompt',
    input: { schema: ReportSummarizerInputSchema },
    output: { schema: ReportSummarizerOutputSchema },

    // The core prompt that instructs the AI model.
    prompt: `
      You are an AI assistant skilled in translating complex medical documents into
      patient-friendly language. Your task is to summarize a medical report into a
      structured format that is clear and easy for a non-medical person to understand.

      - Use simple, direct language. Avoid jargon.
      - Convert key findings into a bulleted list.
      - State the final diagnosis clearly.
      - Convert recommendations into a bulleted list of actionable steps.
      - Always include a disclaimer at the end.

      Medical report text to summarize:
      {{{reportText}}}

      Generate the patient-friendly summary.
    `,
  }
);

const reportSummarizerFlow = ai.defineFlow(
  {
    name: 'reportSummarizerFlow',
    inputSchema: ReportSummarizerInputSchema,
    outputSchema: ReportSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await reportSummarizerPrompt(input);
    if (!output) {
        throw new Error("Report summarization failed to produce a valid output.");
    }
    // The flow returns the generated summary.
    return output;
  }
);
