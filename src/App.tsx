
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DocumentsPage from './pages/DocumentsPage';
import AnalysisPage from './pages/AnalysisPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { Document } from './types';
import { isApiKeySet } from './services/gemini';
import { subscribeToUserDocuments } from './services/documentService';
import Spinner from './components/ui/Spinner';

type View = 'documents' | 'analysis' | 'chat';
type AuthView = 'login' | 'signup' | 'forgot-password';

const ApiKeyWarningBanner = () => (
  <div className="bg-red-600 text-white text-center p-2 font-semibold text-sm">
    Warning: Gemini API key is not set. Please configure your key in the .env file.
  </div>
);

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('documents');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToUserDocuments(user.uid, (docs) => {
      setDocuments(docs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNavigate = (view: View, doc?: Document) => {
    setCurrentView(view);
    if (doc) {
      setSelectedDocument(doc);
    } else if (view === 'documents') {
      setSelectedDocument(null);
    }
  };
  
  const handleDocumentUpdate = (updatedDoc: Document) => {
    setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    if (selectedDocument?.id === updatedDoc.id) {
      setSelectedDocument(updatedDoc);
    }
  };

  const handleNewDocument = (newDoc: Document) => {
    setDocuments(docs => [newDoc, ...docs]);
  };

  const renderContent = () => {
    const documentsPage = (
      <DocumentsPage
        documents={documents}
        onNavigate={handleNavigate}
        onNewDocument={handleNewDocument}
        onDocumentUpdate={handleDocumentUpdate}
        isLoading={isLoading}
        userId={user?.uid || ''}
      />
    );

    switch (currentView) {
      case 'analysis':
        return selectedDocument ? <AnalysisPage document={selectedDocument} onNavigate={handleNavigate} /> : documentsPage;
      case 'chat':
        return selectedDocument && selectedDocument.analysis ? <ChatPage document={selectedDocument} /> : documentsPage;
      case 'documents':
      default:
        return documentsPage;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    switch (authView) {
      case 'login':
        return <LoginPage onToggleMode={() => setAuthView('signup')} onForgotPassword={() => setAuthView('forgot-password')} />;
      case 'signup':
        return <SignupPage onToggleMode={() => setAuthView('login')} />;
      case 'forgot-password':
        return <ForgotPasswordPage onBackToLogin={() => setAuthView('login')} />;
      default:
        return <LoginPage onToggleMode={() => setAuthView('signup')} onForgotPassword={() => setAuthView('forgot-password')} />;
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        selectedDocument={selectedDocument}
        onSignOut={signOut}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isApiKeySet && <ApiKeyWarningBanner />}
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
