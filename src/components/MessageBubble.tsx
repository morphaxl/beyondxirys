import React from 'react';
import './MessageBubble.css';

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

  const formatMarkdown = (text: string) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br />');
    return formatted;
  };

  const isUser = message.role === 'user';

  const bubbleStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: '1rem',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '75%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius)',
    backgroundColor: isUser ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
    color: isUser ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
  };

  const timeStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: isUser ? 'hsl(var(--primary-foreground), 0.7)' : 'hsl(var(--muted-foreground))',
    textAlign: 'right',
    marginTop: '0.5rem',
  };

  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-content">
        <div
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