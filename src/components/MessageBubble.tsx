import React from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

interface BookmarkCard {
  title: string;
  summary: string;
  url: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const parseBookmarkCards = (text: string): { bookmarks: BookmarkCard[]; cleanedText: string } => {
    const bookmarkPattern = /\*\*(.*?)\*\*\s*\nSummary:\s*(.*?)\s*\nLink:\s*(https?:\/\/[^\s]+)\s*\n---/g;
    const bookmarks: BookmarkCard[] = [];
    let match;
    
    while ((match = bookmarkPattern.exec(text)) !== null) {
      bookmarks.push({
        title: match[1].trim(),
        summary: match[2].trim(),
        url: match[3].trim()
      });
    }
    
    // Remove bookmark patterns from text
    const cleanedText = text.replace(bookmarkPattern, '').trim();
    
    return { bookmarks, cleanedText };
  };

  const renderBookmarkCard = (bookmark: BookmarkCard, index: number) => (
    <div key={index} className="bookmark-card">
      <div className="bookmark-header">
        <h4 className="bookmark-title">{bookmark.title}</h4>
        <span className="bookmark-icon">🔖</span>
      </div>
      <p className="bookmark-summary">{bookmark.summary}</p>
      <div className="bookmark-footer">
        <a 
          href={bookmark.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bookmark-link"
        >
          Open Link →
        </a>
      </div>
    </div>
  );

  const formatMarkdown = (text: string) => {
    // Convert markdown to HTML
    let formatted = text
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks: ```code``` -> <pre><code>code</code></pre>
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code: `code` -> <code>code</code>
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Convert URLs to clickable links (must be before line breaks)
      .replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />');

    return formatted;
  };

  // Parse bookmark cards for assistant messages
  const { bookmarks, cleanedText } = message.role === 'assistant' ? 
    parseBookmarkCards(message.content) : 
    { bookmarks: [], cleanedText: message.content };

  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-content">
        {cleanedText.trim() && (
          <div 
            className="message-text"
            dangerouslySetInnerHTML={{ 
              __html: message.role === 'assistant' ? formatMarkdown(cleanedText) : cleanedText 
            }}
          />
        )}
        
        {bookmarks.length > 0 && (
          <div className="bookmark-cards">
            {bookmarks.map((bookmark, index) => renderBookmarkCard(bookmark, index))}
          </div>
        )}
        
        <div className="message-time">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
};

export default MessageBubble; 