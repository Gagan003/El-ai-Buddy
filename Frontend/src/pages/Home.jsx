import React, { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import '../components/chat/ChatLayout.css';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  setChats
} from '../store/chatSlice.js';
import { API_BASE } from '../config.js';

const GITHUB_URL = 'https://github.com/Gagan003/El'; // Update with your GitHub profile URL

const SUGGESTED_PROMPTS = [
  { icon: '💡', label: 'Explain a concept', prompt: 'Explain the concept of machine learning in simple terms' },
  { icon: '📖', label: 'Recommend a book', prompt: 'Recommend a good book about productivity' },
  { icon: '💻', label: 'Help me with coding', prompt: 'Help me debug a JavaScript function' },
  { icon: '🍽️', label: 'Suggest a meal plan', prompt: 'Suggest a healthy meal plan for the week' }
];

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);
  const [ sidebarOpen, setSidebarOpen ] = useState(false);
  const [ socket, setSocket ] = useState(null);
  const [ messages, setMessages ] = useState([]);

  const handleNewChat = async (title) => {
    const name = (title && title.trim()) ? title.trim() : 'New Chat';
    const response = await axios.post(`${API_BASE}/api/chat`, { title: name }, { withCredentials: true });
    setMessages([]);
    dispatch(startNewChat(response.data.chat));
    setSidebarOpen(false);
  };

  const handleSuggestedPrompt = async (prompt) => {
    if (!socket) return;
    let chatId = activeChatId;
    if (!chatId) {
      const response = await axios.post(`${API_BASE}/api/chat`, { title: 'New Chat' }, { withCredentials: true });
      chatId = response.data.chat._id;
      dispatch(startNewChat(response.data.chat));
      setMessages([]);
    }
    setMessages(prev => [...prev, { type: 'user', content: prompt }]);
    dispatch(sendingStarted());
    socket.emit("ai-message", { chat: chatId, content: prompt });
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all chats? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/api/chat`, { withCredentials: true });
      const res = await axios.get(`${API_BASE}/api/chat`, { withCredentials: true });
      dispatch(setChats(res.data.chats || []));
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/api/chat/${chatId}`, { withCredentials: true });
      // Refresh chat list from server after deletion
      const res = await axios.get(`${API_BASE}/api/chat`, { withCredentials: true });
      dispatch(setChats(res.data.chats || []));
      if (activeChatId === chatId) setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameChat = async (chatId, newTitle) => {
    const trimmed = (newTitle && typeof newTitle === 'string') ? newTitle.trim() : '';
    if (!trimmed) return;
    try {
      await axios.patch(`${API_BASE}/api/chat/${chatId}`, { title: trimmed }, { withCredentials: true });
      // Refresh chat list so updated title appears
      const res = await axios.get(`${API_BASE}/api/chat`, { withCredentials: true });
      dispatch(setChats(res.data.chats || []));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    axios.get(`${API_BASE}/api/chat`, { withCredentials: true })
      .then(response => {
        dispatch(setChats(response.data.chats || []));
      })
      .catch(() => dispatch(setChats([])));

    const tempSocket = io(API_BASE, { withCredentials: true });
    tempSocket.on("ai-response", (messagePayload) => {
      setMessages(prev => [...prev, { type: 'ai', content: messagePayload.content }]);
      dispatch(sendingFinished());
    });
    // We rely on REST refresh for title updates; no extra socket handler needed.
    setSocket(tempSocket);
    return () => tempSocket.disconnect();
  }, [dispatch]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    let chatId = activeChatId;
    if (!chatId) {
      try {
        const response = await axios.post(`${API_BASE}/api/chat`, { title: 'New Chat' }, { withCredentials: true });
        chatId = response.data.chat._id;
        dispatch(startNewChat(response.data.chat));
      } catch (err) {
        console.error(err);
        return;
      }
    }

    dispatch(sendingStarted());
    setMessages(prev => [...prev, { type: 'user', content: trimmed }]);
    dispatch(setInput(''));

    socket?.emit("ai-message", { chat: chatId, content: trimmed });
  };

  const getMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/chat/messages/${chatId}`, { withCredentials: true });
      setMessages((response.data.messages || []).map(m => ({
        type: m.role === 'user' ? 'user' : 'ai',
        content: m.content
      })));
    } catch {
      setMessages([]);
    }
  };

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        onNewChat={() => handleNewChat()}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={(initialTitle) => handleNewChat(initialTitle)}
        onClearAll={handleClearAll}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        open={sidebarOpen}
      />
      <main className="chat-main" role="main">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-logo">
              <img src="/ei-logo.png" alt="EI - Your AI Companion for Daily Life" />
            </div>
            <h1>Welcome to EI !</h1>
            <p>How can I assist you today?</p>
            <div className="chat-suggestions">
              {SUGGESTED_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  className="chat-suggestion-card"
                  onClick={() => handleSuggestedPrompt(item.prompt)}
                >
                  <span className="suggestion-icon">{item.icon}</span>
                  <span className="suggestion-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
        <div className="composer-footer-wrapper">
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />
          <footer className="composer-footer-bar">
            <span>El built by Gagandeep </span>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="composer-footer-github" aria-label="GitHub profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            {/* <button type="button" className="composer-footer-clear" onClick={handleClearAll}>
              Clear all chats
            </button> */}
          </footer>
        </div>
      </main>
      {sidebarOpen && (
        <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Home;
