import React, { useState } from 'react';
import { apiService, type Document, type DocumentStats } from '../utils/apiService';

interface DocumentSidebarProps {
  documents: Document[];
  onDocumentAdded: (document: Document) => void;
  onDocumentDeleted: (documentId: string) => void;
  documentsLoading?: boolean;
  documentsError?: string;
  onRetryLoadDocuments?: () => Promise<Document[]>;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ 
  documents, 
  onDocumentAdded, 
  onDocumentDeleted,
  documentsLoading = false,
  documentsError = '',
  onRetryLoadDocuments
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await apiService.deleteDocument(documentId);
      onDocumentDeleted(documentId);
    } catch (error: any) {
      setError(`Failed to delete document: ${error.message}`);
    }
  };

  return (
    <div className="document-sidebar">
      <div className="sidebar-header">
        <h3>🔖 Smart Bookmarks</h3>
        <p className="sidebar-subtitle">Save any article or webpage - I'll remember it so you don't have to!</p>
      </div>

      <form onSubmit={handleAddDocument} className="url-form">
        <div className="form-group">
          <label htmlFor="url">Add Bookmark URL:</label>
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
            Paste any article URL to add to your knowledge base.
          </small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          disabled={loading || !url.trim()}
          className="add-document-btn"
        >
          {loading ? 'Saving...' : '🔖 Save Bookmark'}
        </button>
      </form>

      <div className="documents-list">
        <div className="documents-header">
          <h4>Saved Bookmarks ({documents.length})</h4>
          {documentsLoading && (
            <div className="documents-loading">
              <div className="loading-spinner"></div>
              <small>Loading documents...</small>
            </div>
          )}
        </div>

        {documentsError && (
          <div className="documents-error">
            <div className="error-message">
              ❌ Failed to load bookmarks: {documentsError}
            </div>
            {onRetryLoadDocuments && (
              <button 
                onClick={onRetryLoadDocuments} 
                className="retry-btn"
                disabled={documentsLoading}
              >
                🔄 Retry Loading Bookmarks
              </button>
            )}
          </div>
        )}

        {!documentsLoading && !documentsError && documents.length === 0 ? (
          <p className="no-documents">
            No bookmarks saved yet. Add your first bookmark above and I'll remember it for you!
          </p>
        ) : !documentsLoading && !documentsError ? (
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
                  title="Remove bookmark"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : null}
      </div>

              {loading && (
        <div className="processing-status">
          <div className="loading-spinner"></div>
          <div className="status-text">
            <div>🔍 Reading webpage content...</div>
            <div>📦 Processing bookmark...</div>
            <div>💾 Saving permanently...</div>
            <div>🔗 Creating smart bookmark...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSidebar; 