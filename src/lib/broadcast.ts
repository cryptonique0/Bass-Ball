/**
 * Streaming and broadcast system
 */

export interface StreamSession {
  id: string;
  streamerId: string;
  title: string;
  description: string;
  startTime: number;
  endTime?: number;
  viewers: number;
  status: 'live' | 'scheduled' | 'ended';
  platform: 'internal' | 'twitch' | 'youtube';
  tags: string[];
}

export interface Broadcast {
  id: string;
  title: string;
  matches: string[];
  startTime: number;
  endTime?: number;
  viewers: number;
  status: 'live' | 'scheduled' | 'ended' | 'archived';
  quality: '720p' | '1080p' | '4k';
}

export class BroadcastService {
  private streams: Map<string, StreamSession> = new Map();
  private broadcasts: Map<string, Broadcast> = new Map();
  private viewerHistory: Map<string, number[]> = new Map();

  /**
   * Start streaming
   */
  startStream(
    streamerId: string,
    title: string,
    description: string,
    platform: 'internal' | 'twitch' | 'youtube' = 'internal'
  ): StreamSession {
    const streamId = `stream-${streamerId}-${Date.now()}`;

    const stream: StreamSession = {
      id: streamId,
      streamerId,
      title,
      description,
      startTime: Date.now(),
      viewers: 0,
      status: 'live',
      platform,
      tags: [],
    };

    this.streams.set(streamId, stream);
    this.viewerHistory.set(streamId, [0]);
    return stream;
  }

  /**
   * End stream
   */
  endStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    stream.status = 'ended';
    stream.endTime = Date.now();
    return true;
  }

  /**
   * Update viewer count
   */
  updateViewers(streamId: string, count: number): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    stream.viewers = count;
    const history = this.viewerHistory.get(streamId) || [];
    history.push(count);

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.shift();
    }

    this.viewerHistory.set(streamId, history);
    return true;
  }

  /**
   * Add tag to stream
   */
  addTag(streamId: string, tag: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    if (!stream.tags.includes(tag)) {
      stream.tags.push(tag);
    }

    return true;
  }

  /**
   * Schedule broadcast
   */
  scheduleBroadcast(
    title: string,
    matches: string[],
    startTime: number,
    quality: '720p' | '1080p' | '4k' = '1080p'
  ): Broadcast {
    const broadcastId = `broadcast-${Date.now()}`;

    const broadcast: Broadcast = {
      id: broadcastId,
      title,
      matches,
      startTime,
      viewers: 0,
      status: 'scheduled',
      quality,
    };

    this.broadcasts.set(broadcastId, broadcast);
    return broadcast;
  }

  /**
   * Start broadcast
   */
  startBroadcast(broadcastId: string): boolean {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) return false;

    broadcast.status = 'live';
    return true;
  }

  /**
   * End broadcast
   */
  endBroadcast(broadcastId: string): boolean {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) return false;

    broadcast.status = 'ended';
    broadcast.endTime = Date.now();
    return true;
  }

  /**
   * Archive broadcast
   */
  archiveBroadcast(broadcastId: string): boolean {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast || broadcast.status !== 'ended') return false;

    broadcast.status = 'archived';
    return true;
  }

  /**
   * Get active streams
   */
  getActiveStreams(): StreamSession[] {
    return Array.from(this.streams.values()).filter((s) => s.status === 'live');
  }

  /**
   * Get live broadcasts
   */
  getLiveBroadcasts(): Broadcast[] {
    return Array.from(this.broadcasts.values()).filter((b) => b.status === 'live');
  }

  /**
   * Get stream statistics
   */
  getStreamStatistics(streamId: string) {
    const stream = this.streams.get(streamId);
    if (!stream) return null;

    const history = this.viewerHistory.get(streamId) || [];
    const maxViewers = Math.max(...history);
    const avgViewers = history.length > 0 ? Math.floor(history.reduce((a, b) => a + b, 0) / history.length) : 0;

    return {
      streamId,
      status: stream.status,
      currentViewers: stream.viewers,
      maxViewers,
      averageViewers: avgViewers,
      duration: stream.endTime ? stream.endTime - stream.startTime : Date.now() - stream.startTime,
      platform: stream.platform,
    };
  }

  /**
   * Get broadcast schedule
   */
  getScheduledBroadcasts(): Broadcast[] {
    return Array.from(this.broadcasts.values())
      .filter((b) => b.status === 'scheduled')
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get archived broadcasts
   */
  getArchivedBroadcasts(limit: number = 50): Broadcast[] {
    return Array.from(this.broadcasts.values())
      .filter((b) => b.status === 'archived')
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, limit);
  }
}
