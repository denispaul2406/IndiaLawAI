// Regulatory Alert Summaries
'use server';

/**
 * @fileOverview Generates concise, user-friendly summaries of compliance alerts.
 *
 * - generateRegulatoryAlertSummary - A function that generates summaries of compliance alerts.
 * - RegulatoryAlertSummaryInput - The input type for the generateRegulatoryAlertSummary function.
 * - RegulatoryAlertSummaryOutput - The return type for the generateRegulatoryAlertSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RegulatoryAlertSummaryInputSchema = z.object({
  alertText: z
    .string()
    .describe('The text of the compliance alert to be summarized.'),
});
export type RegulatoryAlertSummaryInput = z.infer<
  typeof RegulatoryAlertSummaryInputSchema
>;

const RegulatoryAlertSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise, user-friendly summary of the compliance alert, including reasoning for the alert.'
    ),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'A confidence score between 0 and 1 indicating the reliability of the summary.'
    ),
  actionableNextSteps: z
    .string()
    .describe('Clear, actionable next steps to address the regulatory issue.'),
});
export type RegulatoryAlertSummaryOutput = z.infer<
  typeof RegulatoryAlertSummaryOutputSchema
>;

export async function generateRegulatoryAlertSummary(
  input: RegulatoryAlertSummaryInput
): Promise<RegulatoryAlertSummaryOutput> {
  return regulatoryAlertSummaryFlow(input);
}

const regulatoryAlertSummaryPrompt = ai.definePrompt({
  name: 'regulatoryAlertSummaryPrompt',
  input: { schema: RegulatoryAlertSummaryInputSchema },
  output: { schema: RegulatoryAlertSummaryOutputSchema },
  prompt: `You are an AI assistant that generates concise, user-friendly summaries of compliance alerts.

  Analyze the following compliance alert text and provide a summary that includes:
  - A clear and concise summary of the alert.
  - Reasoning behind the alert.
  - A confidence score (0-1) indicating the reliability of the summary.
  - Actionable next steps to address the regulatory issue.

  Compliance Alert Text: {{{alertText}}}

  Ensure the output is well-formatted and easy to understand for non-legal professionals.
  Output in the exact JSON format defined.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const regulatoryAlertSummaryFlow = ai.defineFlow(
  {
    name: 'regulatoryAlertSummaryFlow',
    inputSchema: RegulatoryAlertSummaryInputSchema,
    outputSchema: RegulatoryAlertSummaryOutputSchema,
  },
  async input => {
    try {
      const { output } = await regulatoryAlertSummaryPrompt(input);
      if (!output) {
        throw new Error('No output from regulatoryAlertSummaryPrompt');
      }
      return output;
    } catch (e) {
      console.error('Error in regulatoryAlertSummaryFlow', e);
      throw new Error('Failed to generate regulatory alert summary.');
    }
  }
);
