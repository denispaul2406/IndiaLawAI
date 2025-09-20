'use server';

/**
 * @fileOverview Translates text into a specified target language using an AI model.
 *
 * - translateText - A function that handles the translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z
    .string()
    .describe('The target language for translation (e.g., "Hindi", "Tamil").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  // If the target is English, no need to translate.
  if (input.targetLanguage.toLowerCase() === 'english') {
    return { translatedText: input.text };
  }
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `Translate the following text into {{targetLanguage}}.
  Return ONLY the translated text and nothing else.

  Text:
  {{{text}}}
  `,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const { output } = await translateTextPrompt(input);
    if (!output) {
      throw new Error('Translation failed: No output from AI.');
    }
    return output;
  }
);
