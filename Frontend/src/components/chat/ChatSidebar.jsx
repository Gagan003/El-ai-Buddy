import React, { useState, useEffect } from 'react';
import './ChatSidebar.css';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'last week';
  if (diffDays < 21) return '2 weeks ago';
  if (diffDays < 30) return '3 weeks ago';
  return 'last month';
};

const ChatSidebar = ({ chats, activeChatId, onSelectChat, onNewChat, onClearAll, onDeleteChat, onRenameChat, open }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredChats = chats.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!open) setOpenMenuId(null);
  }, [open]);

  return (
    <aside className={`chat-sidebar ${open ? 'open' : ''}`} aria-label="Chat history">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="/ei-logo.png" alt="EI - Your AI Companion" className="sidebar-logo" />
          <h2 className="sidebar-app-name">EI</h2>
        </div>
        <button
          className="sidebar-new-btn"
          onClick={() => {
            const title = window.prompt('Chat title (optional)', 'New Chat');
            onNewChat(title != null ? title : 'New Chat');
          }}
          aria-label="New chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="sidebar-search">
        <input
          type="search"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search chats"
        />
      </div>

      <div className="sidebar-chat-section">
        <h3 className="sidebar-section-title">Chat history</h3>
        <nav className="chat-list" aria-live="polite">
          {filteredChats.map(c => (
            <div
              key={c._id}
              className={`chat-list-item-wrap ${openMenuId === c._id ? 'menu-open' : ''}`}
            >
              <button
                className={`chat-list-item ${c._id === activeChatId ? 'active' : ''}`}
                onClick={() => onSelectChat(c._id)}
              >
                <span className="chat-item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="chat-item-content">
                  <span className="chat-item-title" title={c.title || 'New Chat'}>{c.title || 'New Chat'}</span>
                  <span className="chat-item-meta">
                    {c.messageCount ?? 0} messages {formatRelativeTime(c.lastActivity)}
                  </span>
                </span>
                <button
                  className="chat-item-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(prev => prev === c._id ? null : c._id);
                  }}
                  aria-label="Chat options"
                  aria-expanded={openMenuId === c._id}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
              </button>
              {openMenuId === c._id && (
                <div className="chat-item-dropdown" role="menu">
                  <button
                    type="button"
                    className="chat-item-dropdown-rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTitle = window.prompt('Chat title', c.title || 'New Chat');
                      if (newTitle != null && newTitle.trim()) {
                        onRenameChat?.(c._id, newTitle.trim());
                      }
                      setOpenMenuId(null);
                    }}
                    role="menuitem"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Rename
                  </button>
                  <button
                    type="button"
                    className="chat-item-dropdown-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat?.(c._id);
                      setOpenMenuId(null);
                    }}
                    role="menuitem"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                    </svg>
                    Delete chat
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredChats.length === 0 && (
            <p className="empty-hint">No chats yet.</p>
          )}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-clear-btn" onClick={onClearAll} aria-label="Clear all chats">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
            <path d="M10 11v6M14 11v6" strokeLinecap="round" />
          </svg>
          Clear all chats
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
