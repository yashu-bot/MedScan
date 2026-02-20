
'use server';
/**
 * @fileOverview A Genkit flow for generating and managing OPD (Outpatient Department) slips.
 *
 * - generateOpdSlip - Generates an OPD slip for a patient.
 * - GenerateOpdSlipInput - The input type for the generateOpdSlip function.
 * - OpdSlipData - The return type representing the generated OPD slip.
 */

import { ai } from '@/ai/genkit';
import { type OpdSlipData, OpdSlipDataSchema, type GenerateOpdSlipInput, GenerateOpdSlipInputSchema } from '@/lib/schemas';
// Removed Firestore import as we are reverting the save functionality

function generateTokenNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString().slice(2, 8); // 6 random digits
  return `OPD-${datePart}-${randomPart}`;
}

// Exported function to be called from the frontend
export async function generateOpdSlip(input: GenerateOpdSlipInput): Promise<OpdSlipData> {
  return generateOpdSlipFlow(input);
}

const generateOpdSlipFlow = ai.defineFlow(
  {
    name: 'generateOpdSlipFlow',
    inputSchema: GenerateOpdSlipInputSchema,
    outputSchema: OpdSlipDataSchema,
  },
  async (input) => {
    const { patient } = input;
    const currentDate = new Date().toISOString();
    const token = generateTokenNumber();

    const opdSlip: OpdSlipData = {
      id: `opdslip-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      tokenNumber: token,
      slipDate: currentDate,
      department: "General Medicine",
      // doctorName: "Dr. A. Smith", 
    };

    // The slip is no longer saved to Firestore.
    // console.log(`OPD Slip ${opdSlip.id} for patient ${opdSlip.patientId} generated.`);
    
    return opdSlip;
  }
);
