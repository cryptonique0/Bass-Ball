/**
 * CDN Service - Video delivery optimization and bandwidth management
 */

export interface CDNEndpoint {
  id: string;
  region: string;
  url: string;
  status: 'active' | 'inactive' | 'maintenance';
  latency: number;
  bandwidth: number;
  maxConnections: number;
  activeConnections: number;
  uptime: number;
}

export interface VideoAsset {
  id: string;
  userId: string;
  title: string;
  duration: number;
  fileSize: number;
  uploadUrl: string;
  playUrl: string;
  thumbnailUrl: string;
  format: string;
  quality: string;
  bitrate: number;
  fps: number;
  createdAt: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  isPublic: boolean;
}

export interface BandwidthUsage {
  userId: string;
  date: string;
  totalBandwidth: number;
  uploadBandwidth: number;
  downloadBandwidth: number;
  peakBandwidth: number;
  costs: number;
}

export interface CDNQuality {
  label: string;
  resolution: string;
  bitrate: number;
  fps: number;
  fileSize: number;
}

export class CDNService {
  private endpoints: Map<string, CDNEndpoint> = new Map();
  private assets: Map<string, VideoAsset> = new Map();
  private bandwidthUsage: Map<string, BandwidthUsage> = new Map();
  private qualities: CDNQuality[] = [
    { label: 'Mobile', resolution: '480p', bitrate: 800, fps: 30, fileSize: 0 },
    { label: 'Standard', resolution: '720p', bitrate: 2500, fps: 30, fileSize: 0 },
    { label: 'HD', resolution: '1080p', bitrate: 5000, fps: 60, fileSize: 0 },
    { label: '4K', resolution: '2160p', bitrate: 15000, fps: 60, fileSize: 0 }
  ];

  private readonly COST_PER_GB = 0.085;

  constructor() {
    this.initializeEndpoints();
    this.loadFromStorage();
  }

  private initializeEndpoints(): void {
    const regions = [
      { id: 'us-east', region: 'US East Coast', url: 'https://cdn-use1.bassball.io' },
      { id: 'us-west', region: 'US West Coast', url: 'https://cdn-usw2.bassball.io' },
      { id: 'eu-west', region: 'EU West', url: 'https://cdn-euw1.bassball.io' },
      { id: 'ap-south', region: 'Asia Pacific', url: 'https://cdn-aps1.bassball.io' },
      { id: 'sa-east', region: 'South America', url: 'https://cdn-sae1.bassball.io' }
    ];

    regions.forEach(r => {
      this.endpoints.set(r.id, {
        id: r.id,
        region: r.region,
        url: r.url,
        status: 'active',
        latency: Math.random() * 50 + 10,
        bandwidth: 0,
        maxConnections: 10000,
        activeConnections: 0,
        uptime: 99.99
      });
    });
  }

  // Endpoint Management
  getEndpoints(): CDNEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  getActiveEndpoints(): CDNEndpoint[] {
    return Array.from(this.endpoints.values()).filter(e => e.status === 'active');
  }

  selectOptimalEndpoint(userRegion?: string): CDNEndpoint | undefined {
    const activeEndpoints = this.getActiveEndpoints();
    if (activeEndpoints.length === 0) return undefined;

    if (userRegion) {
      const regional = activeEndpoints.find(e => e.region.toLowerCase().includes(userRegion.toLowerCase()));
      if (regional) return regional;
    }

    return activeEndpoints.reduce((best, current) => {
      const bestScore = best.uptime - (best.latency / 100) - (best.activeConnections / best.maxConnections);
      const currentScore = current.uptime - (current.latency / 100) - (current.activeConnections / current.maxConnections);
      return currentScore > bestScore ? current : best;
    });
  }

  // Asset Management
  createAsset(userId: string, assetData: Partial<VideoAsset>): VideoAsset {
    const endpoint = this.selectOptimalEndpoint();
    if (!endpoint) throw new Error('No available CDN endpoints');

    const asset: VideoAsset = {
      id: `asset_${userId}_${Date.now()}`,
      userId,
      title: assetData.title || 'Video',
      duration: assetData.duration || 0,
      fileSize: assetData.fileSize || 0,
      uploadUrl: `${endpoint.url}/upload/${Date.now()}`,
      playUrl: `${endpoint.url}/play/${assetData.title?.toLowerCase().replace(/\s+/g, '-')}`,
      thumbnailUrl: `${endpoint.url}/thumb/${Date.now()}`,
      format: assetData.format || 'mp4',
      quality: assetData.quality || 'hd',
      bitrate: assetData.bitrate || 5000,
      fps: assetData.fps || 60,
      createdAt: Date.now(),
      status: 'uploading',
      isPublic: assetData.isPublic || false
    };

    this.assets.set(asset.id, asset);
    this.saveToStorage();
    return asset;
  }

  getAsset(assetId: string): VideoAsset | undefined {
    return this.assets.get(assetId);
  }

  getAssets(userId: string): VideoAsset[] {
    return Array.from(this.assets.values()).filter(a => a.userId === userId);
  }

  updateAsset(assetId: string, updates: Partial<VideoAsset>): VideoAsset | undefined {
    const asset = this.assets.get(assetId);
    if (asset) {
      Object.assign(asset, updates);
      this.saveToStorage();
    }
    return asset;
  }

  completeUpload(assetId: string): void {
    const asset = this.assets.get(assetId);
    if (asset) {
      asset.status = 'ready';
      this.recordBandwidthUsage(asset.userId, asset.fileSize, 'upload');
      this.saveToStorage();
    }
  }

  deleteAsset(assetId: string): boolean {
    return this.assets.delete(assetId);
  }

  getPlayUrl(assetId: string): string | undefined {
    const asset = this.assets.get(assetId);
    if (!asset || asset.status !== 'ready') return undefined;
    return asset.playUrl;
  }

  // Bandwidth Management
  private recordBandwidthUsage(userId: string, bytes: number, type: 'upload' | 'download'): void {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `${userId}_${today}`;
    let usage = this.bandwidthUsage.get(usageKey);

    if (!usage) {
      usage = {
        userId,
        date: today,
        totalBandwidth: 0,
        uploadBandwidth: 0,
        downloadBandwidth: 0,
        peakBandwidth: 0,
        costs: 0
      };
    }

    if (type === 'upload') {
      usage.uploadBandwidth += bytes;
    } else {
      usage.downloadBandwidth += bytes;
    }

    usage.totalBandwidth = usage.uploadBandwidth + usage.downloadBandwidth;
    usage.peakBandwidth = Math.max(usage.peakBandwidth, usage.totalBandwidth);
    usage.costs = (usage.downloadBandwidth / (1024 * 1024 * 1024)) * this.COST_PER_GB;

    this.bandwidthUsage.set(usageKey, usage);
    this.saveToStorage();
  }

  recordDownload(userId: string, bytes: number): void {
    this.recordBandwidthUsage(userId, bytes, 'download');
  }

  getBandwidthUsage(userId: string, days: number = 30): BandwidthUsage[] {
    const results: BandwidthUsage[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const usageKey = `${userId}_${dateStr}`;
      
      const usage = this.bandwidthUsage.get(usageKey);
      if (usage) {
        results.push(usage);
      }
    }

    return results;
  }

  // Quality Management
  getAvailableQualities(): CDNQuality[] {
    return [...this.qualities];
  }

  getQuality(label: string): CDNQuality | undefined {
    return this.qualities.find(q => q.label === label);
  }

  calculateFileSize(duration: number, quality: CDNQuality): number {
    return (quality.bitrate * duration) / 8 / 1000;
  }

  // Analytics
  getStats() {
    const totalAssets = this.assets.size;
    const readyAssets = Array.from(this.assets.values()).filter(a => a.status === 'ready').length;
    
    let totalBandwidth = 0;
    this.endpoints.forEach(e => {
      totalBandwidth += e.bandwidth;
    });

    const avgLatency = Array.from(this.endpoints.values())
      .reduce((sum, e) => sum + e.latency, 0) / this.endpoints.size;

    return {
      totalAssets,
      readyAssets,
      activeConnections: Array.from(this.endpoints.values())
        .reduce((sum, e) => sum + e.activeConnections, 0),
      totalBandwidth,
      avgLatency,
      activeEndpoints: this.getActiveEndpoints().length,
      totalEndpoints: this.endpoints.size
    };
  }

  // Storage
  private saveToStorage(): void {
    try {
      const data = {
        assets: Array.from(this.assets.entries()),
        bandwidthUsage: Array.from(this.bandwidthUsage.entries())
      };
      localStorage.setItem('cdnService:global', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving CDN data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('cdnService:global') || '{}');
      if (data.assets) this.assets = new Map(data.assets);
      if (data.bandwidthUsage) this.bandwidthUsage = new Map(data.bandwidthUsage);
    } catch (error) {
      console.error('Error loading CDN data:', error);
    }
  }
}

export const cdnService = new CDNService();
