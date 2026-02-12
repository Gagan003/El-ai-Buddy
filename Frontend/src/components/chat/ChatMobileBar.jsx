import React from 'react';
import './ChatMobileBar.css';
import './ChatLayout.css';


const ChatMobileBar = ({ onToggleSidebar, onNewChat }) => (
  <header className="chat-mobile-bar">
    <button className="chat-icon-btn" onClick={onToggleSidebar} aria-label="Toggle chat history">☰</button>
    <div className="chat-mobile-brand">
      <img src="/ei-logo.png" alt="" className="chat-mobile-logo" aria-hidden />
      <h1 className="chat-app-title">EI</h1>
    </div>
    <button className="chat-icon-btn" onClick={onNewChat} aria-label="New chat">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    </button>
  </header>
);

export default ChatMobileBar;
