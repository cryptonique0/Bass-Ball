/**
 * Social Demo Page
 * Comprehensive showcase of all social features: messaging, social graph, tournaments
 */

'use client';

import React, { useState } from 'react';
import { useMessaging, useSocialGraph, useTournaments } from '@/hooks/useSocial';
import styles from './page.module.css';

type TabType = 'messaging' | 'social' | 'tournaments';

export default function SocialDemoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('messaging');
  const [selectedUserId] = useState('user_123');

  const messaging = useMessaging(selectedUserId);
  const socialGraph = useSocialGraph(selectedUserId);
  const tournaments = useTournaments(selectedUserId);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🤝 Advanced Social Features Demo</h1>
        <p>Direct messaging, social networking, and tournament management</p>
      </header>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${activeTab === 'messaging' ? styles.active : ''}`}
          onClick={() => setActiveTab('messaging')}
        >
          💬 Messaging
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'social' ? styles.active : ''}`}
          onClick={() => setActiveTab('social')}
        >
          👥 Social Graph
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'tournaments' ? styles.active : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          🏆 Tournaments
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'messaging' && <MessagingTab messaging={messaging} />}
        {activeTab === 'social' && <SocialTab socialGraph={socialGraph} />}
        {activeTab === 'tournaments' && <TournamentsTab tournaments={tournaments} />}
      </div>
    </div>
  );
}

/**
 * Messaging Tab
 */
function MessagingTab({ messaging }: any) {
  const [recipientId, setRecipientId] = useState('user_456');
  const [messageText, setMessageText] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const handleSendDirect = () => {
    if (messageText.trim()) {
      messaging.sendDirectMessage(recipientId, messageText);
      setMessageText('');
    }
  };

  const handleCreateGroup = () => {
    if (groupName.trim()) {
      messaging.createGroupChat(groupName, 'Team discussion');
      setGroupName('');
    }
  };

  const handleJoinGroup = (chatId: string) => {
    messaging.joinGroupChat(chatId);
    setSelectedChat(chatId);
  };

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <h2>📨 Direct Messages</h2>
        <div className={styles.messageBox}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Recipient User ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className={styles.input}
            />
            <textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className={styles.textarea}
              rows={3}
            />
            <button onClick={handleSendDirect} className={styles.button}>
              Send Message
            </button>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span>Active Threads:</span>
              <strong>{messaging.threads.length}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Unread Messages:</span>
              <strong>{messaging.unreadCount}</strong>
            </div>
          </div>

          {messaging.threads.length > 0 && (
            <div className={styles.list}>
              <h3>Your Conversations</h3>
              {messaging.threads.map((thread) => (
                <div key={thread.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>
                      {thread.participants.find((p) => p !== 'user_123')}
                    </div>
                    <div className={styles.itemSubtitle}>
                      {thread.messages.length} messages •{' '}
                      {new Date(thread.lastMessageTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.badge}>
                    {thread.unreadCount > 0 && thread.unreadCount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2>👥 Group Chats</h2>
        <div className={styles.groupBox}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="New group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={styles.input}
            />
            <button onClick={handleCreateGroup} className={styles.button}>
              Create Group
            </button>
          </div>

          {messaging.groupChats.length > 0 && (
            <div className={styles.list}>
              <h3>Your Groups</h3>
              {messaging.groupChats.map((chat) => (
                <div key={chat.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{chat.name}</div>
                    <div className={styles.itemSubtitle}>
                      {chat.members.length} members • {chat.messages.length} messages
                    </div>
                  </div>
                  <div className={styles.badge}>{chat.members.length}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Social Graph Tab
 */
function SocialTab({ socialGraph }: any) {
  const [friendRequestId, setFriendRequestId] = useState('');
  const [newFriendId, setNewFriendId] = useState('user_789');

  const handleSendFriendRequest = () => {
    if (newFriendId.trim()) {
      socialGraph.sendFriendRequest(newFriendId, 'Let\'s be friends!');
      setNewFriendId('');
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    socialGraph.removeFriend(friendId);
  };

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <h2>👤 Profile</h2>
        {socialGraph.profile && (
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h3>{socialGraph.profile.username}</h3>
              <span className={styles.badge}>Level {socialGraph.profile.level}</span>
            </div>
            <div className={styles.profileStats}>
              <div className={styles.stat}>
                <span>Total Matches:</span>
                <strong>{socialGraph.profile.totalMatches}</strong>
              </div>
              <div className={styles.stat}>
                <span>Win Rate:</span>
                <strong>{(socialGraph.profile.winRate * 100).toFixed(1)}%</strong>
              </div>
              <div className={styles.stat}>
                <span>Member Since:</span>
                <strong>{new Date(socialGraph.profile.joinedAt).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>🤝 Friends</h2>
        <div className={styles.friendsBox}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Friend User ID"
              value={newFriendId}
              onChange={(e) => setNewFriendId(e.target.value)}
              className={styles.input}
            />
            <button onClick={handleSendFriendRequest} className={styles.button}>
              Send Request
            </button>
          </div>

          {socialGraph.stats && (
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span>Friends:</span>
                <strong>{socialGraph.stats.totalFriends}</strong>
              </div>
              <div className={styles.statItem}>
                <span>Followers:</span>
                <strong>{socialGraph.stats.totalFollowers}</strong>
              </div>
              <div className={styles.statItem}>
                <span>Following:</span>
                <strong>{socialGraph.stats.totalFollowing}</strong>
              </div>
              <div className={styles.statItem}>
                <span>Pending Requests:</span>
                <strong>{socialGraph.stats.friendRequests}</strong>
              </div>
            </div>
          )}

          {socialGraph.friends.length > 0 && (
            <div className={styles.list}>
              <h3>Friends List</h3>
              {socialGraph.friends.map((friend) => (
                <div key={friend.userId} className={styles.item}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{friend.username}</div>
                    <div className={styles.itemSubtitle}>
                      Level {friend.level} • {friend.mutualFriends} mutual friends
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.userId)}
                    className={styles.buttonSmall}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2>💡 Suggested Friends</h2>
        {socialGraph.suggestedFriends && socialGraph.suggestedFriends.length > 0 ? (
          <div className={styles.list}>
            {socialGraph.suggestedFriends.map((friend) => (
              <div key={friend.userId} className={styles.item}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{friend.username}</div>
                  <div className={styles.itemSubtitle}>
                    Level {friend.level} • {friend.mutualFriends} mutual friends
                  </div>
                </div>
                <button
                  onClick={() => socialGraph.sendFriendRequest(friend.userId)}
                  className={styles.button}
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No suggested friends at this time</p>
        )}
      </div>
    </div>
  );
}

/**
 * Tournaments Tab
 */
function TournamentsTab({ tournaments }: any) {
  const [tournamentName, setTournamentName] = useState('Championship 2026');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [format, setFormat] = useState('single_elimination');

  const handleCreateTournament = () => {
    if (tournamentName.trim()) {
      tournaments.createTournament(tournamentName, format, maxParticipants);
      setTournamentName('');
    }
  };

  const handleJoinTournament = (tournamentId: string) => {
    tournaments.joinTournament(tournamentId);
  };

  const handleGenerateBracket = (tournamentId: string) => {
    tournaments.generateBracket(tournamentId);
  };

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <h2>🏆 Create Tournament</h2>
        <div className={styles.formBox}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Tournament name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className={styles.input}
            />
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={styles.input}
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
              <option value="swiss">Swiss</option>
            </select>
            <input
              type="number"
              placeholder="Max participants"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              className={styles.input}
              min="2"
              max="256"
            />
            <button onClick={handleCreateTournament} className={styles.button}>
              Create Tournament
            </button>
          </div>
        </div>
      </div>

      {tournaments.stats && (
        <div className={styles.section}>
          <h2>📊 Tournament Stats</h2>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span>Total Tournaments:</span>
              <strong>{tournaments.stats.totalTournaments}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Active Tournaments:</span>
              <strong>{tournaments.stats.activeTournaments}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Completed Tournaments:</span>
              <strong>{tournaments.stats.completedTournaments}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Tournament Wins:</span>
              <strong>{tournaments.stats.winningTournaments}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Total Prize Winnings:</span>
              <strong>${tournaments.stats.totalPrizeWinnings.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2>🎯 Available Tournaments</h2>
        {tournaments.tournaments && tournaments.tournaments.length > 0 ? (
          <div className={styles.list}>
            {tournaments.tournaments.map((tournament: any) => (
              <div key={tournament.id} className={styles.item}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{tournament.name}</div>
                  <div className={styles.itemSubtitle}>
                    Format: {tournament.format} • Participants: {tournament.participants.length}/
                    {tournament.maxParticipants}
                  </div>
                  <div className={styles.itemSubtitle}>
                    Prize Pool: ${tournament.prizePool} • Status: {tournament.status}
                  </div>
                </div>
                <div className={styles.buttonGroup}>
                  {tournament.participants.includes('user_123') ? (
                    <>
                      <span className={styles.badge}>Joined</span>
                      {tournament.status === 'registration' && (
                        <button
                          onClick={() => handleGenerateBracket(tournament.id)}
                          className={styles.buttonSmall}
                        >
                          Generate Bracket
                        </button>
                      )}
                    </>
                  ) : tournament.status === 'registration' ? (
                    <button
                      onClick={() => handleJoinTournament(tournament.id)}
                      className={styles.button}
                    >
                      Join
                    </button>
                  ) : (
                    <span className={styles.badge}>Full</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No tournaments available</p>
        )}
      </div>

      {tournaments.userTournaments && tournaments.userTournaments.length > 0 && (
        <div className={styles.section}>
          <h2>🎖️ My Tournaments</h2>
          <div className={styles.list}>
            {tournaments.userTournaments.map((tournament: any) => (
              <div key={tournament.id} className={styles.item}>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{tournament.name}</div>
                  <div className={styles.itemSubtitle}>
                    Format: {tournament.format} • Status: {tournament.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
