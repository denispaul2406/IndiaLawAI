'use server';

import {
  complianceCheck,
  type ComplianceCheckOutput,
} from '@/ai/flows/compliance-check';
import {
  generateRegulatoryAlertSummary,
  type RegulatoryAlertSummaryOutput,
} from '@/ai/flows/regulatory-alert-summaries';
import {
  interactiveDocumentQA,
  type InteractiveDocumentQAOutput,
} from '@/ai/flows/interactive-document-qa';
import { documentOcr } from '@/ai/flows/document-ocr';
import { translateText } from '@/ai/flows/translate-text';
import { z } from 'zod';
import pdf from 'pdf-parse-fork';

const AnalyzeDocumentInput = z.object({
  documentText: z.string().optional(),
  imageDataUri: z.string().optional(),
  language: z.string(),
}).refine(data => data.documentText || data.imageDataUri, {
  message: "Either document text or an image/PDF upload is required.",
});

export type AnalysisResult = {
  compliance: ComplianceCheckOutput;
  summary: RegulatoryAlertSummaryOutput;
  documentText: string;
} | null;

const languageCodeMapping: Record<string, string> = {
    'English': 'en',
    'Hindi': 'hi',
    'Tamil': 'ta',
    'Bengali': 'bn',
    'Marathi': 'mr',
}


export async function analyzeDocumentAction(
  prevState: any,
  formData: FormData
): Promise<{ result: AnalysisResult; error: string | null }> {
  const documentText = formData.get('documentText') as string;
  const imageDataUri = formData.get('imageDataUri') as string;
  const language = formData.get('language') as string;

  const validation = AnalyzeDocumentInput.safeParse({ documentText, imageDataUri, language });
  if (!validation.success) {
    return { result: null, error: validation.error.errors[0].message };
  }

  let textToAnalyze = documentText;

  try {
    if (imageDataUri) {
        const languageCode = languageCodeMapping[language] || 'en';
        const ocrResult = await documentOcr({ imageDataUri, language: languageCode });
        textToAnalyze = ocrResult.text;
    }

    if (!textToAnalyze || textToAnalyze.length < 100) {
      return { result: null, error: "Document text must be at least 100 characters long, either from text input, OCR, or PDF extraction." };
    }

    const [complianceResult, summaryResult] = await Promise.all([
      complianceCheck({ documentText: textToAnalyze }),
      generateRegulatoryAlertSummary({ alertText: textToAnalyze }),
    ]);

    let translatedCompliance = complianceResult;
    let translatedSummary = summaryResult;

    if (language !== 'English') {
        const [
            translatedComplianceStatus,
            translatedHeadline,
            translatedBulletPoints,
            translatedRegulations,
            translatedSummaryText,
            translatedActionableSteps
        ] = await Promise.all([
            translateText({ text: complianceResult.complianceStatus, targetLanguage: language }),
            translateText({ text: complianceResult.categoryJustification.headline, targetLanguage: language }),
            Promise.all(complianceResult.categoryJustification.bulletPoints.map(p => translateText({ text: p, targetLanguage: language }))),
            Promise.all(complianceResult.relevantRegulations.map(r => translateText({ text: r, targetLanguage: language }))),
            translateText({ text: summaryResult.summary, targetLanguage: language }),
            translateText({ text: summaryResult.actionableNextSteps, targetLanguage: language }),
        ]);

        translatedCompliance = {
            ...complianceResult,
            complianceStatus: translatedComplianceStatus.translatedText,
            categoryJustification: {
                headline: translatedHeadline.translatedText,
                bulletPoints: translatedBulletPoints.map(p => p.translatedText),
            },
            relevantRegulations: translatedRegulations.map(r => r.translatedText),
        };
        
        translatedSummary = {
            ...summaryResult,
            summary: translatedSummaryText.translatedText,
            actionableNextSteps: translatedActionableSteps.translatedText,
        };
    }
    
    return { result: { compliance: translatedCompliance, summary: translatedSummary, documentText: textToAnalyze }, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An error occurred during analysis. Please try again.';
    return { result: null, error: errorMessage };
  }
}

const AskQuestionInput = z.object({
  documentText: z.string().min(1, "Document text is missing."),
  question: z.string().min(5, "Question must be at least 5 characters long."),
  language: z.string(),
});

export async function askQuestionAction(
  prevState: any,
  formData: FormData
): Promise<{ result: InteractiveDocumentQAOutput | null; error: string | null }> {
    const documentText = formData.get('documentText') as string;
    const question = formData.get('question') as string;
    const language = formData.get('language') as string;

    const validation = AskQuestionInput.safeParse({ documentText, question, language });
    if (!validation.success) {
      return { result: null, error: validation.error.errors[0].message };
    }

    try {
        let questionToAsk = question;
        if (language !== 'English') {
            const translatedQuestion = await translateText({ text: question, targetLanguage: 'English' });
            questionToAsk = translatedQuestion.translatedText;
        }

        const result = await interactiveDocumentQA({ documentText, question: questionToAsk });
        
        if (language !== 'English') {
            const [translatedAnswer, translatedClauses] = await Promise.all([
                translateText({ text: result.answer, targetLanguage: language }),
                Promise.all(result.clauseReferences.map(c => translateText({ text: c, targetLanguage: language })))
            ]);
            result.answer = translatedAnswer.translatedText;
            result.clauseReferences = translatedClauses.map(c => c.translatedText);
        }

        return { result, error: null };
    } catch(e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An error occurred while getting an answer. Please try again.';
        return { result: null, error: errorMessage };
    }
}
