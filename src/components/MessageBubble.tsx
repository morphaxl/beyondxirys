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

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
      // Line breaks
      .replace(/\n/g, '<br />');

    return formatted;
  };

  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-content">
        <div 
          className="message-text"
          dangerouslySetInnerHTML={{ 
            __html: message.role === 'assistant' ? formatMarkdown(message.content) : message.content 
          }}
        />
        <div className="message-time">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
};

export default MessageBubble; 