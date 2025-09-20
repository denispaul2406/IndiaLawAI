'use server';

/**
 * @fileOverview Analyzes legal document text against India-specific regulatory domains and categorizes them based on compliance.
 *
 * - complianceCheck - A function that handles the compliance check process.
 * - ComplianceCheckInput - The input type for the complianceCheck function.
 * - ComplianceCheckOutput - The return type for the complianceCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComplianceCheckInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the legal document to be analyzed.'),
});
export type ComplianceCheckInput = z.infer<typeof ComplianceCheckInputSchema>;

const ComplianceCheckOutputSchema = z.object({
  complianceStatus: z
    .string()
    .describe(
      'The overall compliance status of the document (e.g., Compliant, Non-Compliant, Needs Review).'
    ),
  categoryJustification: z.object({
    headline: z.string().describe('A one-sentence summary of the justification.'),
    bulletPoints: z.array(z.string()).describe('A list of detailed reasons for the compliance status.')
  }).describe(
    'A detailed explanation of why the document was categorized as such, with references to specific clauses or regulations.'
  ),
  relevantRegulations: z
    .array(z.string())
    .describe(
      'A list of specific India-specific regulations that are relevant to the compliance status.'
    ),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'A numerical score (0-1) representing the confidence level of the compliance assessment.'
    ),
  indiaLawScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A holistic "IndiaLaw Compliance Score" from 0 to 100, where 100 is perfectly compliant.'
    ),
  scoreBreakdown: z
    .array(
      z.object({
        category: z.string().describe('The legal category (e.g., Labor, Tax, Contract).'),
        score: z.number().min(0).max(100).describe('The compliance score for this category.'),
      })
    )
    .describe('A breakdown of the compliance score by legal category.'),
});
export type ComplianceCheckOutput = z.infer<typeof ComplianceCheckOutputSchema>;

export async function complianceCheck(input: ComplianceCheckInput): Promise<ComplianceCheckOutput> {
  return complianceCheckFlow(input);
}

const complianceCheckPrompt = ai.definePrompt({
  name: 'complianceCheckPrompt',
  input: {schema: ComplianceCheckInputSchema},
  output: {schema: ComplianceCheckOutputSchema},
  prompt: `You are an expert in Indian legal compliance, specializing in GST, labor laws, and commercial contract obligations.

Analyze the following legal document text. Based on your analysis, you must provide:
1.  A 'complianceStatus' (Compliant, Non-Compliant, or Needs Review).
2.  A 'categoryJustification' object containing a 'headline' (one-sentence summary) and a 'bulletPoints' array explaining your reasoning.
3.  A list of 'relevantRegulations'.
4.  A 'confidenceScore' (0-1) for your overall assessment.
5.  A holistic 'indiaLawScore' from 0 to 100, where 100 is perfect compliance. This score should reflect the severity and number of issues found. A single major violation should result in a low score.
6.  A 'scoreBreakdown' array with scores (0-100) for at least three relevant legal categories (e.g., Labor, Tax, Contract, IP).

Document Text:
{{{documentText}}}

Your response must be only the JSON object, with no additional text or formatting.
`,
});

const complianceCheckFlow = ai.defineFlow(
  {
    name: 'complianceCheckFlow',
    inputSchema: ComplianceCheckInputSchema,
    outputSchema: ComplianceCheckOutputSchema,
  },
  async input => {
    try {
      const {output} = await complianceCheckPrompt(input);
      if (!output) {
        throw new Error('No output from complianceCheckPrompt');
      }
      return output;
    } catch (e) {
      console.error('Error in complianceCheckFlow', e);
      throw new Error('Failed to perform compliance check.');
    }
  }
);
