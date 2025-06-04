import React, { useState } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import ChatInterface from './components/ChatInterface';
import type { Document } from './utils/apiService';
import { initializeBeyondSdk } from './utils/beyondSdk';
import { apiService } from './utils/apiService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string>('');

  React.useEffect(() => {
    let isInitialized = false;

    const initializeApp = async () => {
      if (isInitialized) return; // Prevent multiple initializations

      try {
        // Initialize Beyond SDK first
        console.log('🚀 Initializing Beyond SDK...');
        await initializeBeyondSdk();

        // Check authentication status
        const token = localStorage.getItem('beyond_auth_token');
        const email = localStorage.getItem('beyond_user_email');

        if (token && email) {
          setIsAuthenticated(true);
          setUserEmail(email);

          // Set user email in apiService immediately
          apiService.setUserEmail(email);

          // Load existing documents from backend
          console.log('📚 Loading existing documents...');
          try {
            const { documents: existingDocs } = await apiService.getAllDocuments();
            console.log('✅ Loaded', existingDocs?.length || 0, 'existing documents');
            setDocuments(existingDocs || []); // Ensure we always set an array
          } catch (docError: any) {
            console.warn('⚠️ Could not load existing documents:', docError.message);
            setDocuments([]); // Set empty array on error
          }
        }

        isInitialized = true;
      } catch (error: any) {
        console.error('❌ App initialization failed:', error);
        setSdkError(`SDK initialization failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Handle visibility change to maintain state
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitialized) {
        // Re-check auth state when coming back to the app
        const token = localStorage.getItem('beyond_auth_token');
        const email = localStorage.getItem('beyond_user_email');

        if (token && email) {
          setIsAuthenticated(true);
          setUserEmail(email);
          apiService.setUserEmail(email);
        }
      }
    };

    // Handle page focus to maintain state
    const handleFocus = () => {
      if (isInitialized) {
        // Re-check auth state when window gets focus
        const token = localStorage.getItem('beyond_auth_token');
        const email = localStorage.getItem('beyond_user_email');

        if (token && email) {
          setIsAuthenticated(true);
          setUserEmail(email);
          apiService.setUserEmail(email);
        }
      }
    };

    initializeApp();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array to prevent re-initialization


  const handleSignOut = () => {
    localStorage.removeItem('beyond_auth_token');
    localStorage.removeItem('beyond_user_email');
    setIsAuthenticated(false);
    setUserEmail('');
    setDocuments([]);
  };

  const handleDocumentAdded = (document: Document) => {
    setDocuments(prev => [document, ...prev]);
  };

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading Beyond Gyan...</p>
        <small>Initializing SDK...</small>
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="app-loading">
        <div style={{ color: '#e74c3c', textAlign: 'center' }}>
          <h3>❌ Initialization Error</h3>
          <p>{sdkError}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              backgroundColor: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);

    // Set user email in apiService
    apiService.setUserEmail(email);

    setSdkError('');
  };

  // Load documents when user is authenticated
  useEffect(() => {
    const loadDocuments = async () => {
      if (isAuthenticated && userEmail) {
        try {
          console.log('📚 Loading existing documents for user:', userEmail);

          // Ensure user email is set in API service
          apiService.setUserEmail(userEmail);

          // Small delay to ensure backend is ready
          await new Promise(resolve => setTimeout(resolve, 100));

          const { documents: loadedDocs } = await apiService.getAllDocuments();
          setDocuments(loadedDocs);
          console.log('✅ Loaded', loadedDocs.length, 'existing documents');

          if (loadedDocs.length === 0) {
            console.log('📝 No documents found - user may need to add documents or they may not be persisting properly');
          }
        } catch (error) {
          console.error('❌ Failed to load documents:', error);
          // Set empty array on error to avoid undefined state
          setDocuments([]);
        }
      }
    };

    loadDocuments();
  }, [isAuthenticated, userEmail]);

  if (!isAuthenticated) {
    return (
      <div className="app">
        <AuthForm 
          onAuthSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <ChatInterface 
        userEmail={userEmail} 
        onSignOut={handleSignOut}
        documents={documents}
        onDocumentAdded={handleDocumentAdded}
        onDocumentDeleted={handleDocumentDeleted}
      />
    </div>
  );
}

export default App;