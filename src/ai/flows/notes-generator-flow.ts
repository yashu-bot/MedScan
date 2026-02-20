
'use server';
/**
 * @fileOverview A Genkit flow for generating doctor's notes from keywords.
 *
 * This file defines a Genkit flow that takes keywords related to a patient
 * consultation and generates a structured clinical note.
 *
 * - generateNote - The primary exported function to be called from the client.
 */

import { ai } from '@/ai/genkit';
import { 
    NoteGeneratorInputSchema, 
    NoteGeneratorOutputSchema,
    type NoteGeneratorInput,
    type NoteGeneratorOutput 
} from '@/lib/schemas';

// Exported function to be called from the frontend
export async function generateNote(input: NoteGeneratorInput): Promise<NoteGeneratorOutput> {
  return notesGeneratorFlow(input);
}

const notesGeneratorPrompt = ai.definePrompt(
  {
    name: 'notesGeneratorPrompt',
    input: { schema: NoteGeneratorInputSchema },
    output: { schema: NoteGeneratorOutputSchema },

    // The core prompt that instructs the AI model.
    prompt: `
      You are an AI assistant for a doctor. Your task is to generate a structured clinical note
      based on keywords and phrases from a patient consultation.

      IMPORTANT: Generate a professional, medical-grade SOAP note that could be used in a real clinical setting.
      The note must be concise, accurate, and strictly organized into the following sections:

      SUBJECTIVE (S): Patient's reported symptoms, complaints, and history
      - Start with "Patient reports..." or "Patient presents with..."
      - Include duration, severity, associated symptoms
      - Mention any relevant medical history or medications

      OBJECTIVE (O): Clinical observations and examination findings
      - Start with "On examination..." or "Physical examination reveals..."
      - Include vital signs if mentioned, physical findings
      - Note any diagnostic test results if provided

      ASSESSMENT (A): Clinical impression or diagnosis
      - Start with "Assessment:" or "Clinical impression:"
      - Provide likely diagnosis based on symptoms
      - Include differential diagnoses if appropriate

      PLAN (P): Treatment plan and follow-up
      - Start with "Plan:" or "Treatment plan:"
      - Include medications, dosages, instructions
      - Specify follow-up appointments or tests
      - Include patient education or lifestyle modifications

      EXAMPLES OF GOOD KEYWORD INPUTS:
      - "headache for 3 days, photophobia, no fever, prescribed ibuprofen, follow up in 1 week"
      - "chest pain, shortness of breath, EKG normal, referred to cardiology"
      - "diabetes follow-up, blood sugar controlled, adjusted metformin dose"

      Keywords provided: {{{keywords}}}

      Generate a professional SOAP note now. Make it detailed enough to be clinically useful but concise.
    `,
  }
);

const notesGeneratorFlow = ai.defineFlow(
  {
    name: 'notesGeneratorFlow',
    inputSchema: NoteGeneratorInputSchema,
    outputSchema: NoteGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await notesGeneratorPrompt(input);
    if (!output) {
        throw new Error("Note generation failed to produce a valid output.");
    }
    // The flow returns the generated note which conforms to the output schema.
    return output;
  }
);

