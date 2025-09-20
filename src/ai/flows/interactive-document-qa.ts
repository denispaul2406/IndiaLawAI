'use server';

/**
 * @fileOverview Implements the Genkit flow for interactive question answering on uploaded documents.
 *
 * - interactiveDocumentQA - An async function that takes a document and question as input, then returns an answer with confidence metrics and clause references.
 * - InteractiveDocumentQAInput - The input type for the interactiveDocumentQA function.
 * - InteractiveDocumentQAOutput - The return type for the interactiveDocumentQA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const InteractiveDocumentQAInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the analyzed document.'),
  question: z
    .string()
    .describe('The natural language question about the document.'),
});

export type InteractiveDocumentQAInput = z.infer<
  typeof InteractiveDocumentQAInputSchema
>;

const InteractiveDocumentQAOutputSchema = z.object({
  answer: z.string().describe('The LLM-powered answer to the question.'),
  confidence: z.number().describe('Confidence score for the answer (0-1).'),
  clauseReferences: z
    .array(z.string())
    .describe('References to relevant clauses in the document.'),
});

export type InteractiveDocumentQAOutput = z.infer<
  typeof InteractiveDocumentQAOutputSchema
>;

export async function interactiveDocumentQA(
  input: InteractiveDocumentQAInput
): Promise<InteractiveDocumentQAOutput> {
  return interactiveDocumentQAFlow(input);
}

const interactiveDocumentQAPrompt = ai.definePrompt({
  name: 'interactiveDocumentQAPrompt',
  input: {schema: InteractiveDocumentQAInputSchema},
  output: {schema: InteractiveDocumentQAOutputSchema},
  prompt: `You are an AI assistant specialized in answering questions about legal documents.

  Analyze the following document and answer the question based on the document's content.
  Provide confidence metrics (0-1) for your answer and references to the relevant clauses in the document.

  Document:
  {{documentText}}

  Question:
  {{question}}
  
  Your response must be only the JSON object, with no additional text or formatting.
  `,
});

const interactiveDocumentQAFlow = ai.defineFlow(
  {
    name: 'interactiveDocumentQAFlow',
    inputSchema: InteractiveDocumentQAInputSchema,
    outputSchema: InteractiveDocumentQAOutputSchema,
  },
  async input => {
    try {
      const {output} = await interactiveDocumentQAPrompt(input);
      if (!output) {
        throw new Error('No output from interactiveDocumentQAPrompt');
      }
      return output;
    } catch (e) {
      console.error('Error in interactiveDocumentQAFlow', e);
      throw new Error('Failed to get an answer.');
    }
  }
);
