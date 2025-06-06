import React from 'react';
import './MessageBubble.css';
import { format } from 'date-fns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  documentContext?: any[];
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`message-bubble ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="message-content">
        {isAssistant && message.documentContext && message.documentContext.length > 0 && (
          <div className="document-context">
            <h5>Retrieved from your bookmarks:</h5>
            <ul>
              {message.documentContext.map((doc, index) => (
                <li key={index}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p>{message.content}</p>
      </div>
      <div className="message-time">
        {format(new Date(message.timestamp), 'p')}
      </div>
    </div>
  );
};

export default MessageBubble; 