'use client';

import { useCallback, useEffect, useState } from 'react';
import { streamingService, LiveStream, StreamAccount, StreamAnalytics } from '@/lib/streamingIntegration';
import { replayEngine, Replay, Highlight, Clip, PlaybackSession } from '@/lib/replayEngine';
import { cdnService, VideoAsset } from '@/services/cdn-service';

// Streaming Hook
export function useStreaming(userId: string) {
  const [accounts, setAccounts] = useState<StreamAccount[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);
  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);

  useEffect(() => {
    const updateAccounts = () => setAccounts(streamingService.getAccounts(userId));
    const updateStreams = () => setLiveStreams(streamingService.getLiveStreams(userId));
    updateAccounts();
    updateStreams();
  }, [userId]);

  const connectAccount = useCallback((platform: 'twitch' | 'youtube', token: string, channelData: any) => {
    const account = streamingService.connectAccount(userId, platform, token, channelData);
    setAccounts(prev => [...prev, account]);
    return account;
  }, [userId]);

  const startStream = useCallback((accountId: string, streamData: Partial<LiveStream>) => {
    const stream = streamingService.startStream(userId, accountId, streamData);
    if (stream) {
      setCurrentStream(stream);
      setLiveStreams(prev => [...prev, stream]);
      setAnalytics(streamingService.getAnalytics(stream.id) || null);
      return stream;
    }
  }, [userId]);

  const endStream = useCallback(() => {
    if (currentStream) {
      const updated = streamingService.endStream(currentStream.id);
      if (updated) {
        setCurrentStream(null);
        setLiveStreams(streamingService.getLiveStreams(userId));
      }
    }
  }, [currentStream, userId]);

  const updateViewers = useCallback((viewers: number) => {
    if (currentStream) {
      streamingService.updateStreamViewers(currentStream.id, viewers);
      setCurrentStream(prev => prev ? { ...prev, viewers } : null);
    }
  }, [currentStream]);

  const sendChatMessage = useCallback((content: string) => {
    if (currentStream) {
      streamingService.sendChatMessage(currentStream.id, {
        id: `msg_${Date.now()}`,
        userId,
        username: 'Creator',
        content,
        timestamp: Date.now(),
        emotes: [],
        badges: [],
        highlighted: false,
        isPinned: false,
        userLevel: 'broadcaster'
      });
    }
  }, [currentStream, userId]);

  const addEvent = useCallback((type: any, username: string) => {
    if (currentStream) {
      streamingService.addEvent(currentStream.id, {
        type,
        userId,
        username,
        data: {}
      });
    }
  }, [currentStream, userId]);

  return {
    accounts,
    liveStreams,
    currentStream,
    analytics,
    connectAccount,
    startStream,
    endStream,
    updateViewers,
    sendChatMessage,
    addEvent
  };
}

// Replay Hook
export function useReplays(userId: string) {
  const [replays, setReplays] = useState<Replay[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentReplay, setCurrentReplay] = useState<Replay | null>(null);
  const [playbackSession, setPlaybackSession] = useState<PlaybackSession | null>(null);

  useEffect(() => {
    setReplays(replayEngine.getReplays(userId));
    setHighlights(replayEngine.getHighlights(userId));
    setClips(replayEngine.getClips(userId));
  }, [userId]);

  const createReplay = useCallback((replayData: Partial<Replay>) => {
    const replay = replayEngine.createReplay(userId, replayData);
    setReplays(prev => [...prev, replay]);
    return replay;
  }, [userId]);

  const createHighlight = useCallback((highlightData: Partial<Highlight>) => {
    const highlight = replayEngine.createHighlight(userId, highlightData);
    setHighlights(prev => [...prev, highlight]);
    return highlight;
  }, [userId]);

  const createClip = useCallback((clipData: Partial<Clip>) => {
    const clip = replayEngine.createClip(userId, clipData);
    setClips(prev => [...prev, clip]);
    return clip;
  }, [userId]);

  const startPlayback = useCallback((replayId: string) => {
    const replay = replayEngine.getReplay(replayId);
    if (replay) {
      setCurrentReplay(replay);
      const session = replayEngine.startPlayback(replayId, userId);
      setPlaybackSession(session);
      return session;
    }
  }, [userId]);

  const updatePlayback = useCallback((frame: number, time: number) => {
    if (playbackSession) {
      replayEngine.updatePlaybackPosition(playbackSession.id, frame, time);
    }
  }, [playbackSession]);

  const likeHighlight = useCallback((highlightId: string) => {
    replayEngine.likeHighlight(highlightId);
    setHighlights(prev => prev.map(h => 
      h.id === highlightId ? { ...h, likes: h.likes + 1 } : h
    ));
  }, []);

  const downloadClip = useCallback((clipId: string) => {
    replayEngine.downloadClip(clipId);
    setClips(prev => prev.map(c => 
      c.id === clipId ? { ...c, downloads: c.downloads + 1 } : c
    ));
  }, []);

  const autoGenerateHighlights = useCallback((replayId: string) => {
    const generated = replayEngine.autoGenerateHighlights(replayId, userId);
    setHighlights(prev => [...prev, ...generated]);
    return generated;
  }, [userId]);

  return {
    replays,
    highlights,
    clips,
    currentReplay,
    playbackSession,
    createReplay,
    createHighlight,
    createClip,
    startPlayback,
    updatePlayback,
    likeHighlight,
    downloadClip,
    autoGenerateHighlights
  };
}

// CDN Hook
export function useCDN(userId: string) {
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [bandwidthStats, setBandwidthStats] = useState<any>(null);
  const [cdnStats, setCdnStats] = useState<any>(null);

  useEffect(() => {
    setAssets(cdnService.getAssets(userId));
    setBandwidthStats(cdnService.getBandwidthUsage(userId, 30));
    setCdnStats(cdnService.getStats());
  }, [userId]);

  const uploadAsset = useCallback((assetData: Partial<VideoAsset>) => {
    const asset = cdnService.createAsset(userId, assetData);
    setAssets(prev => [...prev, asset]);
    return asset;
  }, [userId]);

  const completeUpload = useCallback((assetId: string) => {
    cdnService.completeUpload(assetId);
    setAssets(prev => prev.map(a => 
      a.id === assetId ? { ...a, status: 'ready' as const } : a
    ));
  }, []);

  const getPlayUrl = useCallback((assetId: string) => {
    return cdnService.getPlayUrl(assetId);
  }, []);

  const recordDownload = useCallback((assetId: string, bytes: number) => {
    cdnService.recordDownload(userId, bytes);
    setCdnStats(cdnService.getStats());
  }, [userId]);

  const deleteAsset = useCallback((assetId: string) => {
    cdnService.deleteAsset(assetId);
    setAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  return {
    assets,
    bandwidthStats,
    cdnStats,
    uploadAsset,
    completeUpload,
    getPlayUrl,
    recordDownload,
    deleteAsset
  };
}

// Combined Streaming & Content Hook
export function useStreamingContent(userId: string) {
  const streaming = useStreaming(userId);
  const replays = useReplays(userId);
  const cdn = useCDN(userId);

  return {
    streaming,
    replays,
    cdn
  };
}
