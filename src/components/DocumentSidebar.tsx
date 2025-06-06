import React, { useState } from 'react';
import { apiService, type Document } from '../utils/apiService';
import { Sun, Moon } from 'lucide-react';
import './DocumentSidebar.css';
import { useTheme } from '../App';
import CreditsDisplay from './CreditsDisplay';

interface DocumentSidebarProps {
  documents: Document[];
  onDocumentAdded: (document: Document) => void;
  onDocumentDeleted: (documentId: string) => void;
  documentsLoading?: boolean;
  documentsError?: string;
  isOpen: boolean;
  onSignOut: () => void;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ 
  documents, 
  onDocumentAdded, 
  onDocumentDeleted,
  documentsLoading = false,
  documentsError = '',
  isOpen,
  onSignOut
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme, setTheme } = useTheme();

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const document = await apiService.addDocument(url);
      onDocumentAdded(document);
      setUrl('');
    } catch (err: any) {
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
    <aside className={`document-sidebar ${isOpen ? 'open' : ''}`}>
      <form onSubmit={handleAddDocument} className="sidebar-form">
        <div>
          <label htmlFor="url" className="sidebar-input-label">Add Bookmark URL:</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            disabled={loading}
            required
            className="sidebar-input"
          />
          <small className="sidebar-hint">
            Paste any article URL to add to your knowledge base.
          </small>
        </div>

        {error && <div className="sidebar-error">{error}</div>}

        <button 
          type="submit" 
          disabled={loading || !url.trim()}
          className="sidebar-button"
        >
          {loading ? 'Saving...' : 'Save Bookmark'}
        </button>
      </form>

      <div className="documents-list">
        <h4 className="documents-list-header">Saved Bookmarks ({documents.length})</h4>
        
        {documentsLoading && <div>Loading...</div>}
        {documentsError && <div className="sidebar-error">Error: {documentsError}</div>}
        
        {!documentsLoading && !documentsError && documents.length === 0 ? (
          <p>No bookmarks saved yet.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-item-header">
                <h5 className="document-title">{doc.title}</h5>
                <span className="document-date">
                  {new Date(doc.addedAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="document-summary">{doc.summary}</p>
              
              <div className="document-meta">
                <span>{doc.wordCount} words</span> • <span>{doc.metadata?.domain}</span>
              </div>
              
              <div className="document-links">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="document-link">Source</a>
                <a href={doc.irysUrl} target="_blank" rel="noopener noreferrer" className="document-link">Irys Link</a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="delete-button"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-actions">
          <CreditsDisplay />
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <button onClick={onSignOut} className="sign-out-btn">
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default DocumentSidebar; 