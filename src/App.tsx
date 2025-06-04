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
          
          // Load user-specific documents from backend/Irys
          console.log('📚 Loading user-specific documents...');
          try {
            const { documents: existingDocs } = await apiService.getAllDocuments();
            console.log(`✅ Loaded ${existingDocs.length} user documents`);
            setDocuments(existingDocs);
          } catch (docError: any) {
            console.warn('⚠️ Could not load user documents:', docError.message);
            // Don't fail the whole app if documents can't be loaded
            // User can still add new documents
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

  const handleAuthSuccess = async (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    
    // Load user documents after successful authentication
    console.log('👤 User authenticated, loading documents...');
    try {
      const { documents: userDocs } = await apiService.getAllDocuments();
      console.log(`✅ Loaded ${userDocs.length} user documents after login`);
      setDocuments(userDocs);
    } catch (error: any) {
      console.warn('⚠️ Could not load user documents after login:', error.message);
      // Continue without documents - user can add new ones
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="app">
        <AuthForm 
          onAuthSuccess={handleAuthSuccess} 
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
