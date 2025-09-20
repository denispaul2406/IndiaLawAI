# **App Name**: IndiaLawAI

## Core Features:

- Document Upload and OCR: Support upload of various legal document formats: images, scanned PDFs, .txt, .docx. Use Google Vision API for OCR processing enabling high-accuracy text extraction, especially for handwritten and printed Indian MSME documents. Fallback to Tesseract OCR for offline and noisy image scenarios to boost robustness. Pre-processing enhancements: image de-noising, skew correction, resolution normalization.
- Compliance Check: Analyze document text against India-specific regulatory domains: GST, labor laws, commercial contract obligations. Employ InLegalBERT fine-tuned for Indian statutes, legal phrase extraction, and compliance clause classification. Utilize CUAD dataset with Indian-specific annotations for detailed contract clause understanding and risk categorization. Implement a rules engine to codify domain compliance rules using JSON/regex predicates for extensibility.
- Regulatory Alerts & Summaries: Generate real-time, user-friendly compliance alerts with reasoning, confidence scores, and actionable next steps. Use LLM-based summarization (Google Gemini API) with strict ", not legal advice" disclaimers embedded in outputs. Present alerts with severity color-coding and relevant legal citations.
- Multi-Language Support: Integrate Google Translation API for document translation and UI localization into key Indian languages (Hindi, Tamil, Bengali, Marathi). Provide a fallback to open-source translation models for cost savings and offline use cases. Enable users to toggle between original and translated versions interactively.
- Progressive Web App (PWA): Build with React ensuring a fluid mobile-first experience, fully functional across devices. Include drag-and-drop and file-browser upload workflows. Real-time analysis feedback progress bars and status indicators. Offline capabilities with service worker caching and queued uploads for low-connectivity regions.
- Rule Management APIs: RESTful endpoints for CRUD operations on compliance rules, supporting dynamic updates without app redeployment. Local JSON storage initially, designed for upgradeable database-backed persistence.
- Interactive Q&A: Allow natural language queries on analyzed documents using LLM-powered chat interfaces. Provide confidence metrics and contextual clause references with responses.

## Style Guidelines:

- Primary color: HSL(210, 65%, 50%) — medium-dark blue #3FA7FF to convey trust and reliability.
- Background color: Light blue-gray HSL(210, 20%, 95%) #F0F4F8 for professional, clean contrast.
- Accent color: Bright cyan HSL(180, 70%, 40%) #33BDBD to highlight alerts, important info.
- Headline font: 'Poppins' — geometric, approachable sans-serif, excellent readability.
- Body font: 'PT Sans' — warm, humanist sans-serif for comfortable long-form reading.
- Use recognizable and clear, professional legal icons for document types, compliance statuses, and actionable alerts.
- Design a well-structured, clean layout with distinct sections for upload, analysis outcomes, alerts, and rule details to reduce cognitive load.