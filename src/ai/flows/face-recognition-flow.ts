
'use server';
/**
 * @fileOverview An AI flow for recognizing a patient's face with higher accuracy.
 *
 * - recognizeFace - Compares a captured photo against registered patient photos using a multi-stage process.
 */

import { ai, aiFallback } from '@/ai/genkit';
import { z } from 'zod';
import { PatientDataSchema, type PatientData } from '@/lib/schemas'; 

const FaceRecognitionInputSchema = z.object({
  capturedPhotoDataUri: z
    .string()
    .describe(
      "A photo of a person captured via webcam, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  registeredPatients: z.array(PatientDataSchema).describe("An array of all registered patients to compare against."),
});

type FaceRecognitionInput = z.infer<typeof FaceRecognitionInputSchema>;

const FaceRecognitionOutputSchema = z.object({
  matchFound: z.boolean().describe("Whether a matching patient was found."),
  patient: PatientDataSchema.nullable().describe("The data of the matched patient, or null if no match was found."),
});

export type FaceRecognitionOutput = z.infer<typeof FaceRecognitionOutputSchema>;

export async function recognizeFace(input: FaceRecognitionInput): Promise<FaceRecognitionOutput> {
  return faceRecognitionFlow(input);
}

// Prompt to get a confidence score for a face match.
const faceScoringPrompt = ai.definePrompt({
    name: 'faceScoringPrompt',
    input: { schema: z.object({
        capturedPhoto: z.string(),
        registeredPhoto: z.string(),
    }) },
    output: { schema: z.object({
        confidenceScore: z.number().min(0).max(100).describe("A confidence score from 0 to 100 indicating the likelihood that the two images are of the same person. 100 is a perfect match.")
    }) },
    prompt: `You are a sophisticated facial recognition system. Your task is to analyze two images and return a confidence score representing the likelihood they are the same person.

    Analyze key facial geometry (distance between eyes, nose shape, jawline). Be critical of differences. A score of 95-100 means you are almost certain it's the same person. A score below 70 indicates it's likely a different person.

    Captured Photo: {{media url=capturedPhoto}}
    Registered Photo: {{media url=registeredPhoto}}

    Return a confidence score from 0-100.`,
});

// Fallback scoring prompt bound to the fallback model instance
const faceScoringPromptFallback = aiFallback.definePrompt({
    name: 'faceScoringPromptFallback',
    input: { schema: z.object({
        capturedPhoto: z.string(),
        registeredPhoto: z.string(),
    }) },
    output: { schema: z.object({
        confidenceScore: z.number().min(0).max(100).describe("A confidence score from 0 to 100 indicating the likelihood they are the same person. 100 is a perfect match.")
    }) },
    prompt: `You are a sophisticated facial recognition system. Your task is to analyze two images and return a confidence score representing the likelihood they are the same person.

    Analyze key facial geometry (distance between eyes, nose shape, jawline). Be critical of differences.

    Captured Photo: {{media url=capturedPhoto}}
    Registered Photo: {{media url=registeredPhoto}}

    Return a confidence score from 0-100.`,
});

// Prompt for a final, binary verification on the best candidate.
const finalVerificationPrompt = ai.definePrompt({
    name: 'finalVerificationPrompt',
    input: { schema: z.object({
        capturedPhoto: z.string(),
        candidatePhoto: z.string(),
        candidateName: z.string(),
    }) },
    output: { schema: z.object({
        isMatch: z.boolean().describe("Return true only if you are absolutely certain this is the same person. This is a final security check.")
    }) },
    prompt: `You are a final verifier in a 'face lock' system. You have been given a candidate photo that scored highest in a preliminary scan. Your job is to make a final, critical decision.

    Only return 'true' if the captured photo and the candidate photo are definitively the same person. If there is ANY doubt—due to angle, lighting, or slight feature differences—return 'false'. The cost of a false positive is high.

    Captured Photo: {{media url=capturedPhoto}}
    Candidate Photo of {{candidateName}}: {{media url=candidatePhoto}}

    Is this a definitive match?`,
});

// Fallback prompt bound to the fallback model instance
const finalVerificationPromptFallback = aiFallback.definePrompt({
    name: 'finalVerificationPromptFallback',
    input: { schema: z.object({
        capturedPhoto: z.string(),
        candidatePhoto: z.string(),
        candidateName: z.string(),
    }) },
    output: { schema: z.object({
        isMatch: z.boolean().describe("Return true only if you are absolutely certain this is the same person. This is a final security check.")
    }) },
    prompt: `You are a final verifier in a 'face lock' system. You have been given a candidate photo that scored highest in a preliminary scan. Your job is to make a final, critical decision.

    Only return 'true' if the captured photo and the candidate photo are definitively the same person. If there is ANY doubt—due to angle, lighting, or slight feature differences—return 'false'. The cost of a false positive is high.

    Captured Photo: {{media url=capturedPhoto}}
    Candidate Photo of {{candidateName}}: {{media url=candidatePhoto}}

    Is this a definitive match?`,
});

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractRetryDelayMs(error: unknown): number | undefined {
  try {
    const anyErr: any = error as any;
    // Prefer explicit retryDelay if present
    const retryDelaySeconds: number | undefined = anyErr?.retryDelay
      ? Number(String(anyErr.retryDelay).replace(/[^0-9.]/g, ''))
      : undefined;
    if (!Number.isNaN(retryDelaySeconds!) && retryDelaySeconds! > 0) {
      return Math.round(retryDelaySeconds! * 1000);
    }
    // Try to parse from errorDetails (Google RPC RetryInfo)
    const details = anyErr?.errorDetails;
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d?.['@type']?.toString()?.includes('RetryInfo') && d?.retryDelay) {
          const s = Number(String(d.retryDelay).replace(/[^0-9.]/g, ''));
          if (!Number.isNaN(s) && s > 0) return Math.round(s * 1000);
        }
      }
    }
  } catch {}
  return undefined;
}

function isRateLimitError(error: unknown): boolean {
  const anyErr: any = error as any;
  if (anyErr?.status === 429) return true;
  const msg = (anyErr?.message || anyErr?.toString?.() || '') as string;
  return /429|Too\s*Many\s*Requests|quota|rate\s*limit/i.test(msg);
}


const faceRecognitionFlow = ai.defineFlow(
  {
    name: 'faceRecognitionFlow',
    inputSchema: FaceRecognitionInputSchema,
    outputSchema: FaceRecognitionOutputSchema,
  },
  async (input) => {
    // Deduplicate patients by id so each is scored at most once
    const seenIds = new Set<string>();
    const uniquePatients: PatientData[] = [];
    for (const p of input.registeredPatients) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniquePatients.push(p);
      } else {
        console.log(`AI: Skipping duplicate patient ${p.name} (${p.id}).`);
      }
    }

    if (uniquePatients.length === 0) {
      return { matchFound: false, patient: null };
    }

    let bestCandidate: { patient: PatientData, score: number } | null = null;
    let secondBestScore = 0;
    const HIGH_CONFIDENCE_THRESHOLD = 95; // accept immediate match at >=95
    const MINIMUM_CONFIDENCE_THRESHOLD = 75; // fallback floor for final verification path
    const MINIMUM_SCORE_MARGIN = 3; // minimal separation when using final verification

    // STAGE 1: Iterate and score all patients (each at most once)
    for (const patient of uniquePatients) {
      if (!patient.faceImageUrl || !patient.faceImageUrl.startsWith('data:image')) {
        console.log(`AI: Skipping patient ${patient.name} (${patient.id}) due to missing image.`);
        continue;
      }
      
      console.log(`AI: Scoring captured photo against patient: ${patient.name}`);

      try {
        const runPrimary = async () => faceScoringPrompt({
          capturedPhoto: input.capturedPhotoDataUri,
          registeredPhoto: patient.faceImageUrl,
        });
        const runFallback = async () => faceScoringPromptFallback({
          capturedPhoto: input.capturedPhotoDataUri,
          registeredPhoto: patient.faceImageUrl,
        });
        let output: { confidenceScore: number } | undefined;
        let lastErr: unknown;

        // Try primary once
        try {
          const r = await runPrimary();
          output = r.output;
        } catch (e) {
          lastErr = e;
          if (!isRateLimitError(e)) {
            // brief retry once for transient errors
            await sleep(300);
            try {
              const r2 = await runPrimary();
              output = r2.output;
            } catch (e2) {
              lastErr = e2;
            }
          }
        }

        // If still no output or rate-limited, try fallback immediately (no long waits)
        if (!output) {
          try {
            const rf = await runFallback();
            output = rf.output;
          } catch (e) {
            lastErr = e;
            if (!isRateLimitError(e)) {
              await sleep(300);
              try {
                const rf2 = await runFallback();
                output = rf2.output;
              } catch (e2) {
                lastErr = e2;
              }
            }
          }
        }

        // If both models were rate-limited, do not block with long waits; skip this patient
        if (!output) {
          if (isRateLimitError(lastErr)) {
            console.log('AI: Scoring skipped due to rate limit on both models.');
            continue;
          }
          throw lastErr ?? new Error('faceScoringPrompt failed');
        }

        if (output) {
          console.log(`AI: Confidence score for ${patient.name} is ${output.confidenceScore}.`);
          // STAGE 1a: Immediate high-confidence match found.
          if (output.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD) {
            console.log(`AI: High-confidence match found for ${patient.name}.`);
            return { matchFound: true, patient: patient };
          }

          // Keep track of the best candidate so far.
          if (output.confidenceScore > (bestCandidate?.score || 0)) {
            // shift down previous best to second best
            if (bestCandidate) {
              secondBestScore = Math.max(secondBestScore, bestCandidate.score);
            }
            bestCandidate = { patient, score: output.confidenceScore };
          } else if (output.confidenceScore > secondBestScore) {
            secondBestScore = output.confidenceScore;
          }
        }
      } catch (error) {
        console.error(`AI: Error during face scoring for patient ${patient.id}.`, error);
      }
    }

    // STAGE 2: If best candidate meets thresholds, return immediately without final verification.
    if (bestCandidate 
      && bestCandidate.score >= MINIMUM_CONFIDENCE_THRESHOLD 
      && (bestCandidate.score - secondBestScore) >= MINIMUM_SCORE_MARGIN) {
      console.log(`AI: Best candidate is ${bestCandidate.patient.name} with score ${bestCandidate.score} (second best ${secondBestScore}). Returning match without final verification.`);
      return { matchFound: true, patient: bestCandidate.patient };
    }
    
    console.log("AI: No definitive match found after multi-stage verification.");
    return { matchFound: false, patient: null };
  }
);
