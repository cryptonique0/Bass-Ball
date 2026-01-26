'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatManager, ChatMessage, ChatChannel, DirectMessage } from '@/lib/chatSystem';
import { Send, X, Smile, Hash, Lock, Users, Phone, MoreVertical, Paperclip } from 'lucide-react';

/**
 * Chat Component
 * In-app messaging system
 */
export function ChatComponent() {
  const chatMgr = ChatManager.getInstance();
  const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels');
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [dms, setDMs] = useState<DirectMessage[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [selectedDM, setSelectedDM] = useState<DirectMessage | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [userId] = useState('player_1');
  const [userName] = useState('Player Name');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = () => {
    setChannels(chatMgr.getUserChannels(userId));
    setDMs(chatMgr.getUserDirectMessages(userId));

    if (selectedChannel) {
      setMessages(chatMgr.getChannelMessages(selectedChannel.channelId, 100));
    } else if (selectedDM) {
      setMessages(selectedDM.messages.slice(-100));
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    if (selectedChannel) {
      chatMgr.sendMessage(selectedChannel.channelId, userId, userName, messageInput);
    } else if (selectedDM) {
      chatMgr.sendDirectMessage(selectedDM.dmId, userId, userName, messageInput);
    }

    setMessageInput('');
    loadData();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeChat = selectedChannel || selectedDM;
  const chatTitle = selectedChannel ? `#${selectedChannel.name}` : selectedDM ? selectedDM.participant2Name : 'Select a chat';

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4">Messages</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                activeTab === 'channels'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Channels
            </button>
            <button
              onClick={() => setActiveTab('dms')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                activeTab === 'dms'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              Direct
            </button>
          </div>
        </div>

        {/* Channel/DM List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'channels' && (
            <div className="space-y-1 p-2">
              {channels.map(channel => (
                <button
                  key={channel.channelId}
                  onClick={() => {
                    setSelectedChannel(channel);
                    setSelectedDM(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    selectedChannel?.channelId === channel.channelId
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {channel.type === 'direct' ? <Lock size={18} /> : <Hash size={18} />}
                  <span className="truncate text-sm font-semibold">{channel.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'dms' && (
            <div className="space-y-1 p-2">
              {dms.map(dm => (
                <button
                  key={dm.dmId}
                  onClick={() => {
                    setSelectedDM(dm);
                    setSelectedChannel(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    selectedDM?.dmId === dm.dmId
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Users size={18} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {dm.participant1Id === userId ? dm.participant2Name : dm.participant1Name}
                    </div>
                    {dm.lastMessageAt && (
                      <div className="text-xs text-slate-500 truncate">
                        {new Date(dm.lastMessageAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{chatTitle}</h2>
            <button className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-700">
              <MoreVertical size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <MessageBubble key={msg.messageId} message={msg} isOwn={msg.senderId === userId} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-slate-800 border-t border-slate-700 p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="flex gap-2 text-slate-500 text-sm">
              <button className="flex items-center gap-1 hover:text-slate-400 transition">
                <Paperclip size={16} />
                Attach
              </button>
              <button className="flex items-center gap-1 hover:text-slate-400 transition">
                <Smile size={16} />
                Emoji
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a channel or conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  if (message.isDeleted) {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-slate-500 italic">[Message deleted]</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full ${isOwn ? 'bg-emerald-600' : 'bg-slate-700'} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
        {message.senderName.charAt(0).toUpperCase()}
      </div>

      <div className={`flex-1 max-w-sm ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="text-xs text-slate-400 mb-1">
          {message.senderName}
          {message.edited && <span className="ml-2 text-slate-500">(edited)</span>}
        </div>

        <div
          className={`px-4 py-2 rounded-lg break-words ${
            isOwn
              ? 'bg-emerald-600 text-white rounded-br-none'
              : 'bg-slate-700 text-slate-200 rounded-bl-none'
          }`}
        >
          {message.content}
        </div>

        {message.reactions.size > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {Array.from(message.reactions.entries()).map(([emoji, users]) => (
              <button
                key={emoji}
                className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition"
              >
                <span>{emoji}</span>
                <span className="text-slate-400">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
