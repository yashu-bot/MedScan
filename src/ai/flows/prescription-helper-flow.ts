
'use server';
/**
 * @fileOverview A Genkit flow for generating prescription suggestions.
 *
 * This file defines a Genkit flow that takes a medical diagnosis and provides a
 * draft prescription suggestion.
 *
 * - generatePrescription - The primary exported function.
 */

import { ai, aiFallback } from '@/ai/genkit';
import { 
    PrescriptionHelperInputSchema, 
    PrescriptionHelperOutputSchema,
    type PrescriptionHelperInput,
    type PrescriptionHelperOutput 
} from '@/lib/schemas';

// Exported function to be called from the frontend
export async function generatePrescription(input: PrescriptionHelperInput): Promise<PrescriptionHelperOutput> {
  return prescriptionHelperFlow(input);
}

const prescriptionHelperPrompt = ai.definePrompt(
  {
    name: 'prescriptionHelperPrompt',
    input: { schema: PrescriptionHelperInputSchema },
    output: { schema: PrescriptionHelperOutputSchema },

    // The core prompt that instructs the AI model.
    prompt: `
      You are an AI assistant designed to help doctors by drafting prescription suggestions.
      Your suggestions should be based on common treatment guidelines for the provided diagnosis.
      Provide the output in a structured format.

      The draft should include:
      1.  **Medications**: Suggest 1-2 common medications for the diagnosis, including a standard dosage (e.g., 500mg) and frequency (e.g., Twice a day for 7 days). For each suggested medication, also provide an estimated unit price (number only; do not include currency symbols or text) in local currency for a single tablet/strip.
      2.  **Advice**: Include a list of brief, non-pharmacological advice points (e.g., rest, hydration).
      3.  **Disclaimer**: Crucially, you must ALWAYS include a prominent disclaimer that this is a draft suggestion and the attending physician must verify all details (drug names, dosages, patient allergies, contraindications) before issuing a final, official prescription.

      Diagnosis provided: {{{diagnosis}}}

      Generate the structured prescription draft now.
    `,
  }
);

const prescriptionHelperPromptFallback = aiFallback.definePrompt(
  {
    name: 'prescriptionHelperPromptFallback',
    input: { schema: PrescriptionHelperInputSchema },
    output: { schema: PrescriptionHelperOutputSchema },
    prompt: `
      You are an AI assistant designed to help doctors by drafting prescription suggestions.
      Your suggestions should be based on common treatment guidelines for the provided diagnosis.
      Provide the output in a structured format.

      The draft should include:
      1.  **Medications**: Suggest 1-2 common medications for the diagnosis, including a standard dosage (e.g., 500mg) and frequency (e.g., Twice a day for 7 days). For each suggested medication, also provide an estimated unit price (number only; do not include currency symbols or text) in local currency for a single tablet/strip.
      2.  **Advice**: Include a list of brief, non-pharmacological advice points (e.g., rest, hydration).
      3.  **Disclaimer**: Crucially, you must ALWAYS include a prominent disclaimer that this is a draft suggestion and the attending physician must verify all details (drug names, dosages, patient allergies, contraindications) before issuing a final, official prescription.

      Diagnosis provided: {{{diagnosis}}}

      Generate the structured prescription draft now.
    `,
  }
);

const prescriptionHelperFlow = ai.defineFlow(
  {
    name: 'prescriptionHelperFlow',
    inputSchema: PrescriptionHelperInputSchema,
    outputSchema: PrescriptionHelperOutputSchema,
  },
  async (input) => {
    function isRateLimitError(error: unknown): boolean {
      const anyErr: any = error as any;
      if (anyErr?.status === 429) return true;
      const msg = (anyErr?.message || anyErr?.toString?.() || '') as string;
      return /429|Too\s*Many\s*Requests|quota|rate\s*limit/i.test(msg);
    }

    let output = undefined as (PrescriptionHelperOutput | undefined);
    let lastErr: unknown;

    // Primary attempt
    try {
      const res = await prescriptionHelperPrompt(input);
      output = res.output;
    } catch (e) {
      lastErr = e;
    }

    // If rate-limited or no output, try fallback quickly
    if (!output) {
      try {
        const res = await prescriptionHelperPromptFallback(input);
        output = res.output;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!output) {
      if (isRateLimitError(lastErr)) {
        throw new Error('Prescription generation is temporarily rate-limited. Please try again shortly.');
      }
      throw lastErr ?? new Error('Prescription generation failed to produce a valid output.');
    }

    return output;
  }
);
