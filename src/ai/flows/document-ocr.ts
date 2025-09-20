'use server';

/**
 * @fileOverview Extracts text from a document image using Google Vision API.
 *
 * - documentOcr - A function that handles the OCR process.
 * - DocumentOcrInput - The input type for the documentOcr function.
 * - DocumentOcrOutput - The return type for the documentOcr function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ImageAnnotatorClient } from '@google-cloud/vision';

const DocumentOcrInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image or PDF of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().optional().describe('An optional language hint for the OCR engine (e.g., "en", "hi").'),
});
export type DocumentOcrInput = z.infer<typeof DocumentOcrInputSchema>;

const DocumentOcrOutputSchema = z.object({
  text: z.string().describe('The extracted text from the document image.'),
});
export type DocumentOcrOutput = z.infer<typeof DocumentOcrOutputSchema>;

export async function documentOcr(input: DocumentOcrInput): Promise<DocumentOcrOutput> {
  return documentOcrFlow(input);
}

const documentOcrFlow = ai.defineFlow(
  {
    name: 'documentOcrFlow',
    inputSchema: DocumentOcrInputSchema,
    outputSchema: DocumentOcrOutputSchema,
  },
  async (input) => {
    try {
      const visionClient = new ImageAnnotatorClient();

      const imageContent = input.imageDataUri.split(';base64,').pop();
      if (!imageContent) {
        throw new Error('Invalid image data URI.');
      }
      
      const mimeType = input.imageDataUri.match(/data:(.*);base64,/)?.[1];
      
      let request: any;

      if (mimeType === 'application/pdf') {
         request = {
            requests: [{
              inputConfig: {
                content: imageContent,
                mimeType: 'application/pdf',
              },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
              imageContext: input.language ? { languageHints: [input.language] } : undefined,
            }]
         };
         
         const [operation] = await visionClient.asyncBatchAnnotateFiles(request);
         const [result] = await operation.promise();
         
         const annotation = result.responses?.[0]?.fullTextAnnotation;
         if (!annotation || !annotation.text) {
            throw new Error('No text found in the PDF.');
         }
         return { text: annotation.text };

      } else {
        request = {
            image: {
              content: imageContent,
            },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            imageContext: input.language ? { languageHints: [input.language] } : undefined,
        };
        const [result] = await visionClient.documentTextDetection(request as any);
        const fullTextAnnotation = result.fullTextAnnotation;
      
        if (!fullTextAnnotation || !fullTextAnnotation.text) {
          throw new Error('No text found in the image.');
        }
        return { text: fullTextAnnotation.text };
      }

    } catch (e) {
      console.error('Error in documentOcrFlow', e);
      throw new Error('Failed to perform OCR on the document.');
    }
  }
);
