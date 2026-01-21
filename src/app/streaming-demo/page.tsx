'use client';

import { useState, useEffect } from 'react';
import { useStreamingContent } from '@/hooks/useStreaming';
import styles from './streaming-demo.module.css';

const userId = 'demo_user_001';

export default function StreamingDemo() {
  const { streaming, replays, cdn } = useStreamingContent(userId);
  const [activeTab, setActiveTab] = useState<'streaming' | 'replays' | 'cdn'>('streaming');

  // Simulate live stream data
  useEffect(() => {
    if (streaming.currentStream === null && streaming.accounts.length === 0) {
      streaming.connectAccount('twitch', 'demo_token_123', {
        channelId: 'ch_demo_001',
        channelName: 'BassBallStreamer',
        displayName: 'BassBall Pro',
        avatar: 'https://via.placeholder.com/150',
        verified: true
      });
    }
  }, []);

  const startLiveStream = () => {
    if (streaming.accounts.length > 0) {
      streaming.startStream(streaming.accounts[0].id, {
        title: 'Live Bass Ball Championship Match',
        description: 'Championship finals - watch the best plays!',
        thumbnailUrl: 'https://via.placeholder.com/1280x720',
        resolution: '1080p',
        fps: 60,
        bitrate: 6000
      });
    }
  };

  const simulateViewers = () => {
    const viewers = Math.floor(Math.random() * 5000) + 100;
    streaming.updateViewers(viewers);
  };

  const createReplayDemo = () => {
    const replay = replays.createReplay({
      title: 'Championship Match Replay',
      description: 'Full replay of the championship match',
      duration: 1800,
      quality: '1080p60'
    });

    // Auto-generate highlights
    if (replay) {
      setTimeout(() => replays.autoGenerateHighlights(replay.id), 500);
    }
  };

  const createClipDemo = () => {
    if (replays.highlights.length > 0) {
      replays.createClip({
        highlightId: replays.highlights[0].id,
        format: 'mp4',
        startTime: 0,
        endTime: 30,
        title: 'Epic Play Clip',
        expiresIn: 604800
      });
    }
  };

  const uploadVideoAsset = () => {
    cdn.uploadAsset({
      filename: 'championship_highlights.mp4',
      size: 524288000,
      mimeType: 'video/mp4',
      duration: 120
    });
  };

  const getStreamStats = () => {
    return {
      viewers: streaming.currentStream?.viewers || 0,
      duration: streaming.currentStream ? Math.floor((Date.now() - streaming.currentStream.createdAt) / 1000) : 0,
      activeChats: streaming.currentStream?.chatMessages.length || 0,
      peakViewers: streaming.analytics?.peakViewers || 0,
      avgViewTime: streaming.analytics?.avgViewDuration || 0
    };
  };

  const stats = getStreamStats();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎮 Bass Ball Streaming & Content Hub</h1>
        <p>Live streaming, replays, and content creation platform</p>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'streaming' ? styles.active : ''}`}
          onClick={() => setActiveTab('streaming')}
        >
          📡 Live Streaming
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'replays' ? styles.active : ''}`}
          onClick={() => setActiveTab('replays')}
        >
          🎬 Replays & Clips
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'cdn' ? styles.active : ''}`}
          onClick={() => setActiveTab('cdn')}
        >
          📦 CDN & Video Delivery
        </button>
      </nav>

      {activeTab === 'streaming' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📡 Live Streaming Integration</h2>
            <p>Broadcast to Twitch and YouTube with advanced analytics</p>
          </div>

          <div className={styles.grid}>
            {/* Connected Accounts */}
            <div className={styles.card}>
              <h3>🔗 Connected Accounts</h3>
              {streaming.accounts.length > 0 ? (
                <div className={styles.accountsList}>
                  {streaming.accounts.map(account => (
                    <div key={account.id} className={styles.accountItem}>
                      <span className={styles.platform}>{account.platform.toUpperCase()}</span>
                      <span className={styles.channel}>{account.channelName}</span>
                      <span className={styles.status}>✓ Connected</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No accounts connected yet</p>
              )}
            </div>

            {/* Stream Status */}
            <div className={styles.card}>
              <h3>📊 Stream Status</h3>
              {streaming.currentStream ? (
                <div className={styles.streamStatus}>
                  <div className={styles.statusBadge}>🔴 LIVE</div>
                  <div className={styles.statItem}>
                    <span>Viewers:</span>
                    <strong>{stats.viewers.toLocaleString()}</strong>
                  </div>
                  <div className={styles.statItem}>
                    <span>Duration:</span>
                    <strong>{Math.floor(stats.duration / 60)}m {stats.duration % 60}s</strong>
                  </div>
                  <div className={styles.statItem}>
                    <span>Peak Viewers:</span>
                    <strong>{stats.peakViewers.toLocaleString()}</strong>
                  </div>
                  <div className={styles.statItem}>
                    <span>Avg Watch Time:</span>
                    <strong>{Math.round(stats.avgViewTime / 60)}m</strong>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>Stream not active</p>
              )}
            </div>

            {/* Stream Controls */}
            <div className={styles.card}>
              <h3>🎮 Stream Controls</h3>
              <div className={styles.buttonGroup}>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={startLiveStream}
                  disabled={streaming.currentStream !== null}
                >
                  {streaming.currentStream ? '🔴 STREAMING' : '▶ Start Stream'}
                </button>
                <button 
                  className={styles.button}
                  onClick={simulateViewers}
                  disabled={!streaming.currentStream}
                >
                  👥 Simulate Viewers
                </button>
                <button 
                  className={`${styles.button} ${styles.danger}`}
                  onClick={() => streaming.endStream()}
                  disabled={!streaming.currentStream}
                >
                  ⏹ End Stream
                </button>
              </div>
            </div>

            {/* Chat Activity */}
            <div className={styles.card}>
              <h3>💬 Chat Activity</h3>
              {streaming.currentStream?.chatMessages && streaming.currentStream.chatMessages.length > 0 ? (
                <div className={styles.chatList}>
                  {streaming.currentStream.chatMessages.slice(-5).map((msg, i) => (
                    <div key={i} className={styles.chatItem}>
                      <span className={styles.username}>{msg.username}</span>
                      <span className={styles.message}>{msg.content}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No chat messages yet</p>
              )}
            </div>

            {/* Stream Events */}
            <div className={styles.card}>
              <h3>🎉 Recent Events</h3>
              {streaming.currentStream?.events && streaming.currentStream.events.length > 0 ? (
                <div className={styles.eventsList}>
                  {streaming.currentStream.events.slice(-5).map((event, i) => (
                    <div key={i} className={styles.eventItem}>
                      <span className={styles.eventType}>{event.type}</span>
                      <span className={styles.eventUser}>{event.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No events yet</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'replays' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>🎬 Replays & Highlight Clips</h2>
            <p>Create, manage, and share game highlights with advanced editing</p>
          </div>

          <div className={styles.grid}>
            {/* Replay Manager */}
            <div className={styles.card}>
              <h3>📹 Replay Manager</h3>
              <div className={styles.buttonGroup}>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={createReplayDemo}
                >
                  ➕ Create Replay
                </button>
              </div>
              <div className={styles.replayList}>
                <p className={styles.count}>Total Replays: {replays.replays.length}</p>
                {replays.replays.length > 0 && (
                  <ul>
                    {replays.replays.slice(-3).map(r => (
                      <li key={r.id} className={styles.listItem}>
                        📽 {r.title || 'Untitled Replay'} ({r.duration}s)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div className={styles.card}>
              <h3>⭐ Auto-Generated Highlights</h3>
              <div className={styles.highlightsList}>
                <p className={styles.count}>Total Highlights: {replays.highlights.length}</p>
                {replays.highlights.length > 0 ? (
                  <div className={styles.highlightGrid}>
                    {replays.highlights.slice(-4).map(h => (
                      <div key={h.id} className={styles.highlightItem}>
                        <div className={styles.highlightType}>{h.type}</div>
                        <div className={styles.highlightStats}>
                          ❤️ {h.likes} • 💬 {h.comments.length}
                        </div>
                        <button 
                          className={styles.smallButton}
                          onClick={() => replays.likeHighlight(h.id)}
                        >
                          Like
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.empty}>No highlights yet. Create a replay to generate highlights!</p>
                )}
              </div>
            </div>

            {/* Clips */}
            <div className={styles.card}>
              <h3>🎬 Shareable Clips</h3>
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.button}
                  onClick={createClipDemo}
                  disabled={replays.highlights.length === 0}
                >
                  ✂️ Create Clip
                </button>
              </div>
              <div className={styles.clipsList}>
                <p className={styles.count}>Total Clips: {replays.clips.length}</p>
                {replays.clips.length > 0 && (
                  <ul>
                    {replays.clips.slice(-3).map(c => (
                      <li key={c.id} className={styles.listItem}>
                        🎬 {c.title || 'Untitled Clip'} ({c.format})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Playback */}
            <div className={styles.card}>
              <h3>▶️ Playback Controls</h3>
              {replays.currentReplay ? (
                <div className={styles.playbackInfo}>
                  <p>Now Playing: {replays.currentReplay.title}</p>
                  <div className={styles.progressBar}></div>
                  <div className={styles.controls}>
                    {replays.playbackSession && (
                      <>
                        <span>Speed: {replays.playbackSession.playbackSpeed}x</span>
                        <span>Volume: {Math.round(replays.playbackSession.volume * 100)}%</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>Select a replay to watch</p>
              )}
            </div>

            {/* Analytics */}
            <div className={styles.card}>
              <h3>📊 Replay Analytics</h3>
              {replays.currentReplay?.analytics ? (
                <div className={styles.analytics}>
                  <div className={styles.analyticItem}>
                    <span>Views:</span>
                    <strong>{replays.currentReplay.analytics.views}</strong>
                  </div>
                  <div className={styles.analyticItem}>
                    <span>Completion Rate:</span>
                    <strong>{replays.currentReplay.analytics.completionRate}%</strong>
                  </div>
                  <div className={styles.analyticItem}>
                    <span>Avg Watch Time:</span>
                    <strong>{replays.currentReplay.analytics.avgWatchTime}s</strong>
                  </div>
                  <div className={styles.analyticItem}>
                    <span>Peak Viewers:</span>
                    <strong>{replays.currentReplay.analytics.peakConcurrentViewers}</strong>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>No analytics data yet</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'cdn' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📦 CDN & Video Delivery</h2>
            <p>Global video distribution with 5 CDN endpoints and bandwidth optimization</p>
          </div>

          <div className={styles.grid}>
            {/* CDN Endpoints */}
            <div className={`${styles.card} ${styles.fullWidth}`}>
              <h3>🌍 Global CDN Endpoints</h3>
              <div className={styles.endpointGrid}>
                <div className={styles.endpointCard}>
                  <div className={styles.endpointName}>🇺🇸 US East</div>
                  <div className={styles.endpointStat}>Latency: 12ms</div>
                  <div className={styles.endpointStat}>Bandwidth: 98.5%</div>
                  <div className={styles.endpointStat}>Uptime: 99.99%</div>
                </div>
                <div className={styles.endpointCard}>
                  <div className={styles.endpointName}>🇺🇸 US West</div>
                  <div className={styles.endpointStat}>Latency: 15ms</div>
                  <div className={styles.endpointStat}>Bandwidth: 97.2%</div>
                  <div className={styles.endpointStat}>Uptime: 99.98%</div>
                </div>
                <div className={styles.endpointCard}>
                  <div className={styles.endpointName}>🇪🇺 EU West</div>
                  <div className={styles.endpointStat}>Latency: 8ms</div>
                  <div className={styles.endpointStat}>Bandwidth: 99.1%</div>
                  <div className={styles.endpointStat}>Uptime: 99.99%</div>
                </div>
                <div className={styles.endpointCard}>
                  <div className={styles.endpointName}>🌏 Asia Pacific</div>
                  <div className={styles.endpointStat}>Latency: 22ms</div>
                  <div className={styles.endpointStat}>Bandwidth: 96.8%</div>
                  <div className={styles.endpointStat}>Uptime: 99.97%</div>
                </div>
                <div className={styles.endpointCard}>
                  <div className={styles.endpointName}>🇧🇷 South America</div>
                  <div className={styles.endpointStat}>Latency: 18ms</div>
                  <div className={styles.endpointStat}>Bandwidth: 95.5%</div>
                  <div className={styles.endpointStat}>Uptime: 99.96%</div>
                </div>
              </div>
            </div>

            {/* Video Assets */}
            <div className={styles.card}>
              <h3>📹 Video Assets</h3>
              <div className={styles.buttonGroup}>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={uploadVideoAsset}
                >
                  ⬆️ Upload Asset
                </button>
              </div>
              <div className={styles.assetsList}>
                <p className={styles.count}>Total Assets: {cdn.assets.length}</p>
                {cdn.assets.length > 0 && (
                  <ul>
                    {cdn.assets.slice(-3).map(a => (
                      <li key={a.id} className={styles.listItem}>
                        📹 {a.filename} - {a.status}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Quality Tiers */}
            <div className={styles.card}>
              <h3>🎥 Quality Presets</h3>
              <div className={styles.qualityTiers}>
                <div className={styles.tier}>
                  <span className={styles.tierName}>📱 Mobile</span>
                  <span className={styles.tierSpec}>480p • 800 kbps</span>
                </div>
                <div className={styles.tier}>
                  <span className={styles.tierName}>🖥️ Standard</span>
                  <span className={styles.tierSpec}>720p • 2500 kbps</span>
                </div>
                <div className={styles.tier}>
                  <span className={styles.tierName}>🎬 HD</span>
                  <span className={styles.tierSpec}>1080p • 5000 kbps</span>
                </div>
                <div className={styles.tier}>
                  <span className={styles.tierName}>🌟 4K</span>
                  <span className={styles.tierSpec}>2160p • 15000 kbps</span>
                </div>
              </div>
            </div>

            {/* Bandwidth Usage */}
            <div className={styles.card}>
              <h3>📊 Bandwidth Usage (30 Days)</h3>
              {cdn.bandwidthStats ? (
                <div className={styles.bandwidthStats}>
                  {cdn.bandwidthStats.map((stat: any, i: number) => (
                    <div key={i} className={styles.statBar}>
                      <span className={styles.date}>{stat.date}</span>
                      <div className={styles.barContainer}>
                        <div 
                          className={styles.bar}
                          style={{ width: `${Math.min((stat.bytesUsed / 1000000000) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className={styles.value}>{(stat.bytesUsed / 1000000000).toFixed(2)} GB</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No bandwidth data yet</p>
              )}
            </div>

            {/* Cost Analysis */}
            <div className={styles.card}>
              <h3>💰 Cost Analysis</h3>
              {cdn.cdnStats ? (
                <div className={styles.costAnalysis}>
                  <div className={styles.costItem}>
                    <span>Total Bandwidth:</span>
                    <strong>{(cdn.cdnStats.totalBandwidth / 1000000000).toFixed(2)} GB</strong>
                  </div>
                  <div className={styles.costItem}>
                    <span>Monthly Cost:</span>
                    <strong>${cdn.cdnStats.estimatedCost.toFixed(2)}</strong>
                  </div>
                  <div className={styles.costItem}>
                    <span>Rate:</span>
                    <strong>$0.085 / GB</strong>
                  </div>
                  <div className={styles.costItem}>
                    <span>Active Endpoints:</span>
                    <strong>5 Regions</strong>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>No cost data yet</p>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <p>🎮 Bass Ball Streaming Platform v1.0 • Production Ready</p>
      </footer>
    </div>
  );
}
