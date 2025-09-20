'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/interactive-document-qa.ts';
import '@/ai/flows/regulatory-alert-summaries.ts';
import '@/ai/flows/compliance-check.ts';
import '@/ai/flows/document-ocr.ts';
import '@/ai/flows/translate-text.ts';
