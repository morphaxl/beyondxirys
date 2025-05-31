import React, { useState } from 'react';
import { apiService, type Document, type DocumentStats } from '../utils/apiService';

interface DocumentSidebarProps {
  documents: Document[];
  onDocumentAdded: (document: Document) => void;
  onDocumentDeleted: (documentId: string) => void;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ 
  documents, 
  onDocumentAdded, 
  onDocumentDeleted 
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [irysBalance, setIrysBalance] = useState<string>('0');
  const [initializationError, setInitializationError] = useState('');
  const [serviceWalletInfo, setServiceWalletInfo] = useState<any>(null);
  const [stats, setStats] = useState<DocumentStats | null>(null);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      console.log('📋 Adding document via backend API:', url);
      
      // Add document through backend API
      const document = await apiService.addDocument(url);
      
      console.log('✅ Document added successfully:', document);
      
      // Notify parent component
      onDocumentAdded(document);
      setUrl('');
      
      // Update service info
      await updateServiceInfo();
      
      console.log('📄 Document stored on Irys:', document.irysUrl);
    } catch (err: any) {
      console.error('❌ Failed to add document:', err);
      let errorMessage = 'Failed to add document';
      
      if (err.message.includes('Invalid URL')) {
        errorMessage = 'Please provide a valid URL';
      } else if (err.message.includes('Failed to access')) {
        errorMessage = 'Could not access the website. Please check the URL and try again.';
      } else if (err.message.includes('scrape') || err.message.includes('fetch')) {
        errorMessage = 'Failed to extract content from the website';
      } else if (err.message.includes('storage') || err.message.includes('Irys')) {
        errorMessage = 'Failed to store document permanently';
      }
      
      setError(errorMessage + (err.message ? ` (${err.message})` : ''));
    } finally {
      setLoading(false);
    }
  };

  const updateServiceInfo = async () => {
    try {
      // Get statistics (documents are managed by parent)
      const { statistics } = await apiService.getAllDocuments();
      setStats(statistics);
      
      // Get Irys balance
      const balance = await apiService.getIrysBalance();
      setIrysBalance(balance.balance);
      
      setInitializationError('');
    } catch (error: any) {
      console.error('❌ Failed to update service info:', error);
      setInitializationError('Backend connection issue');
    }
  };

  const verifyServiceWallet = async () => {
    try {
      setInitializationError('Checking service wallet...');
      const walletInfo = await apiService.getIrysWallet();
      setServiceWalletInfo(walletInfo);
      setInitializationError('✅ Service wallet verified');
      console.log('🔍 Service wallet info:', walletInfo);
    } catch (error: any) {
      setInitializationError(`❌ Service wallet check failed: ${error.message}`);
      console.error('Service wallet error:', error);
    }
  };

  const testBackendConnection = async () => {
    try {
      setError('');
      setInitializationError('Testing backend connection...');
      
      const isHealthy = await apiService.healthCheck();
      if (isHealthy) {
        await updateServiceInfo();
        setInitializationError('✅ Connected to backend service');
      } else {
        setInitializationError('❌ Backend service not available');
      }
    } catch (error: any) {
      setInitializationError(`❌ Connection failed: ${error.message}`);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await apiService.deleteDocument(documentId);
      onDocumentDeleted(documentId);
      await updateServiceInfo();
    } catch (error: any) {
      setError(`Failed to delete document: ${error.message}`);
    }
  };

  React.useEffect(() => {
    updateServiceInfo();
  }, []);

  return (
    <div className="document-sidebar">
      <div className="sidebar-header">
        <h3>📚 Document Storage</h3>
        <div className="irys-status">
          <div className="service-info">
            <small className="service-label">🔧 Backend Service (FREE Irys Devnet)</small>
            <div className="irys-balance">
              <small>Balance: {irysBalance} ETH (Free Tokens)</small>
            </div>
          </div>
          
          {serviceWalletInfo && (
            <div className="wallet-info">
              <small><strong>Service Wallet:</strong> {serviceWalletInfo.address.slice(0, 6)}...{serviceWalletInfo.address.slice(-4)}</small>
              <small><strong>Network:</strong> {serviceWalletInfo.network}</small>
              <small><strong>Balance:</strong> {serviceWalletInfo.balance} ETH</small>
              <small className="devnet-info">✅ Using FREE devnet uploads</small>
            </div>
          )}

          {stats && (
            <div className="stats-info">
              <small><strong>Total Documents:</strong> {stats.totalDocuments}</small>
              <small><strong>Total Words:</strong> {stats.totalWords.toLocaleString()}</small>
              <small><strong>Domains:</strong> {stats.domains.length}</small>
            </div>
          )}
          
          <div className="devnet-notice">
            <small>📝 Backend handles all scraping & Irys storage automatically</small>
          </div>
          
          {initializationError && (
            <div className={`initialization-status ${initializationError.includes('✅') ? 'success' : 'error'}`}>
              <small>{initializationError}</small>
            </div>
          )}
          
          <div className="connection-buttons">
            <button onClick={verifyServiceWallet} className="test-connection-btn">
              Check Service
            </button>
            <button onClick={testBackendConnection} className="test-connection-btn">
              Test Backend
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleAddDocument} className="url-form">
        <div className="form-group">
          <label htmlFor="url">Add Document URL:</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            disabled={loading}
            required
          />
          <small className="url-hint">
            Backend will scrape content and store permanently on Irys devnet (FREE).
          </small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          disabled={loading || !url.trim()}
          className="add-document-btn"
        >
          {loading ? 'Processing...' : '📄 Add Document'}
        </button>
      </form>

      <div className="documents-list">
        <h4>Stored Documents ({documents.length})</h4>
        {documents.length === 0 ? (
          <p className="no-documents">
            No documents stored yet. Add your first document above to start building your knowledge base!
          </p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-header">
                <h5 className="document-title">{doc.title}</h5>
                <span className="document-date">
                  {new Date(doc.addedAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="document-summary">{doc.summary}</p>
              
              <div className="document-meta">
                <small>📊 {doc.wordCount} words • 🌐 {doc.metadata?.domain}</small>
              </div>
              
              <div className="document-links">
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="source-link"
                  title="View original source"
                >
                  🔗 Source
                </a>
                <a 
                  href={doc.irysUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="irys-link"
                  title="View permanent Irys storage"
                >
                  🌐 Irys Link
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="delete-btn"
                  title="Delete document"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {loading && (
        <div className="processing-status">
          <div className="loading-spinner"></div>
          <div className="status-text">
            <div>🔍 Scraping content via backend...</div>
            <div>📦 Processing data...</div>
            <div>🆓 Uploading to Irys devnet (FREE)...</div>
            <div>🌐 Creating permanent storage...</div>
            <div>🔗 Generating permanent link...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSidebar; 