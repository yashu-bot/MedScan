import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

// Secondary instance used as a fallback when the primary model hits rate limits
// or is otherwise unavailable. Choose a different model family to avoid sharing
// the same per-model quotas.
export const aiFallback = genkit({
  plugins: [googleAI()],
  // Use a different, generally lighter model to reduce quota contention.
  // Pick a broadly available model to avoid 404/permission issues.
  model: 'googleai/gemini-2.0-flash-lite',
});
