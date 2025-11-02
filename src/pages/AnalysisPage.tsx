
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Document, RiskLevel } from '../types';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import ScoreGauge from '../components/analysis/ScoreGauge';
import CategoryBreakdown from '../components/analysis/CategoryBreakdown';
import RiskList from '../components/analysis/RiskList';
import { SUPPORTED_LANGUAGES } from '../constants';
import Button from '../components/ui/Button';
import { exportAnalysisToPDF } from '../services/pdfExport';
import { sendAnalysisByEmail } from '../services/emailService';
import { translateRisksContent } from '../services/gemini';

interface AnalysisPageProps {
  document: Document;
  onNavigate: (view: 'chat', doc: Document) => void;
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ document, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [translatedRisks, setTranslatedRisks] = useState(document.analysis?.risks || []);
  const [isTranslating, setIsTranslating] = useState(false);
  const analysis = document.analysis;

  const handleLanguageChange = async (lang: string) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    
    // Translate risks in real-time
    if (analysis && lang !== 'en') {
      setIsTranslating(true);
      try {
        const translated = await translateRisksContent(analysis.risks, lang);
        setTranslatedRisks(translated);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedRisks(analysis.risks);
      } finally {
        setIsTranslating(false);
      }
    } else if (lang === 'en') {
      setTranslatedRisks(analysis?.risks || []);
    }
  };

  const handlePdfExport = async () => {
    setPdfExporting(true);
    try {
      await exportAnalysisToPDF(document, selectedLang);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setPdfExporting(false);
    }
  };

  // Fix: Add a dedicated UI for when the document status is 'Error'.
  if (document.status === 'Error') {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <ErrorIcon />
        <h2 className="mt-4 text-xl font-semibold text-red-600">Analysis Failed</h2>
        <p className="text-gray-600 mt-2">The document "{document.name}" could not be analyzed.</p>
        {document.errorMessage && (
          <p className="mt-2 text-sm text-gray-500 bg-red-50 p-3 rounded-md border border-red-200 max-w-md">
            <strong>Reason:</strong> {document.errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center">
        <Spinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold">{t('analysis.analyzing')}</h2>
        <p className="text-gray-600">{t('analysis.analyzingDesc')}: {document.name}</p>
      </div>
    );
  }

  const riskCounts = analysis.riskSummary;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('analysis.dashboard')}</h1>
          <p className="text-gray-600 mt-1">{t('analysis.reportFor')}: <span className="font-semibold">{document.name}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onNavigate('chat', document)} variant="secondary">
            <ChatIcon /> {t('analysis.askAI')}
          </Button>
          <Button onClick={() => alert('Re-analysis triggered!')}>
            <RefreshIcon /> {t('analysis.reanalyze')}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4 text-center">{t('analysis.indialawScore')}</h2>
            <ScoreGauge score={analysis.indiaLawScore} />
          </Card>
          <Card>
            <h2 className="text-lg font-semibold mb-4">{t('analysis.riskSummary')}</h2>
            <div className="space-y-3">
              <RiskSummaryItem level="HIGH" count={riskCounts.high} />
              <RiskSummaryItem level="MEDIUM" count={riskCounts.medium} />
              <RiskSummaryItem level="LOW" count={riskCounts.low} />
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">{t('analysis.categoryBreakdown')}</h2>
            <CategoryBreakdown data={analysis.categoryScores} />
          </Card>
        </div>
      </div>

      {/* Risk Details Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{t('analysis.risks')}</h2>
            <div className="flex items-center gap-4">
                <select 
                    value={selectedLang} 
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </select>
                <Button variant="outline" onClick={handlePdfExport} disabled={pdfExporting}>
                  <DownloadIcon className="w-4 h-4 mr-2" /> {pdfExporting ? <Spinner /> : t('analysis.exportPDF')}
                </Button>
                <Button variant="outline" onClick={() => setShowEmailModal(true)}>
                  <MailIcon className="w-4 h-4 mr-2" /> {t('analysis.emailReport')}
                </Button>
            </div>
        </div>
        {isTranslating ? (
          <div className="flex justify-center items-center py-10">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-600">Translating content...</span>
          </div>
        ) : (
          <RiskList risks={translatedRisks} />
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('analysis.sendReport')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('analysis.emailAddress')}
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={emailSending}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmailModal(false)}
                  disabled={emailSending}
                >
                  {t('analysis.cancel')}
                </Button>
                <Button 
                  onClick={async () => {
                    if (!emailAddress) return;
                    setEmailSending(true);
                    try {
                      await sendAnalysisByEmail(document, emailAddress);
                      setShowEmailModal(false);
                      setEmailAddress('');
                      alert('Email sent successfully!');
                    } catch (error) {
                      alert('Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error'));
                    } finally {
                      setEmailSending(false);
                    }
                  }}
                  disabled={emailSending || !emailAddress}
                >
                  {emailSending ? <Spinner /> : t('analysis.send')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RiskSummaryItem: React.FC<{ level: RiskLevel; count: number }> = ({ level, count }) => {
  const colors: Record<RiskLevel, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <span className={`h-3 w-3 rounded-full ${colors[level]} mr-3`}></span>
        <span className="text-sm font-medium text-gray-700">{level} Risk</span>
      </div>
      <span className="text-lg font-bold text-gray-900">{count}</span>
    </div>
  );
};

const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const MailIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>;

export default AnalysisPage;
