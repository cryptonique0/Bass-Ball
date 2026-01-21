/**
 * Fan Merchandise System
 * Enables fans to order team shirts and other merchandise
 */

import { TeamCustomization } from './teamCustomization';

export type JerseyType = 'home' | 'away' | 'neutral';
export type ShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Shirt order from a fan
 */
export interface ShirtOrder {
  orderId: string;
  teamId: string;
  teamName: string;
  fanAddress: string;
  jerseyType: JerseyType;
  size: ShirtSize;
  playerName?: string; // Optional custom name on back
  playerNumber?: number; // Optional custom number (1-99)
  
  // Pricing (in wei or token units)
  basePrice: string;
  customizationFee: string;
  shippingFee: string;
  totalPrice: string;
  currency: 'ETH' | 'USDC' | 'GAME_TOKEN';
  
  // Order status
  status: OrderStatus;
  orderDate: number;
  confirmedDate?: number;
  shippedDate?: number;
  deliveredDate?: number;
  trackingNumber?: string;
  
  // Shipping details
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  
  // Metadata
  transactionHash?: string;
  ipfsMetadataHash?: string;
}

/**
 * Team merchandise pricing
 */
export interface TeamMerchandisePricing {
  teamId: string;
  homeShirtPrice: string; // In wei
  awayShirtPrice: string;
  neutralShirtPrice: string;
  customNameFee: string;
  customNumberFee: string;
  shippingFee: string;
  currency: 'ETH' | 'USDC' | 'GAME_TOKEN';
  discountForHolders: number; // Percentage discount for team NFT holders
  royaltyPercentage: number; // Percentage that goes to team
}

/**
 * Fan Merchandise Manager
 */
export class FanMerchandiseManager {
  private static instance: FanMerchandiseManager;
  private orders: Map<string, ShirtOrder> = new Map();
  private teamPricing: Map<string, TeamMerchandisePricing> = new Map();
  private teamOrders: Map<string, string[]> = new Map(); // teamId -> orderIds
  private fanOrders: Map<string, string[]> = new Map(); // fanAddress -> orderIds

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): FanMerchandiseManager {
    if (!FanMerchandiseManager.instance) {
      FanMerchandiseManager.instance = new FanMerchandiseManager();
    }
    return FanMerchandiseManager.instance;
  }

  /**
   * Set team merchandise pricing
   */
  setTeamPricing(
    teamId: string,
    pricing: Omit<TeamMerchandisePricing, 'teamId'>
  ): TeamMerchandisePricing {
    const teamPricing: TeamMerchandisePricing = {
      teamId,
      ...pricing,
    };
    
    this.teamPricing.set(teamId, teamPricing);
    this.saveToStorage();
    return teamPricing;
  }

  /**
   * Get team pricing
   */
  getTeamPricing(teamId: string): TeamMerchandisePricing | undefined {
    return this.teamPricing.get(teamId);
  }

  /**
   * Create a new shirt order
   */
  createShirtOrder(
    teamId: string,
    teamName: string,
    fanAddress: string,
    jerseyType: JerseyType,
    size: ShirtSize,
    shippingAddress: ShirtOrder['shippingAddress'],
    options?: {
      playerName?: string;
      playerNumber?: number;
    }
  ): ShirtOrder {
    const orderId = `order-${teamId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const pricing = this.teamPricing.get(teamId);
    
    if (!pricing) {
      throw new Error(`No pricing configured for team ${teamId}`);
    }

    // Calculate prices
    let basePrice = pricing.homeShirtPrice;
    if (jerseyType === 'away') basePrice = pricing.awayShirtPrice;
    if (jerseyType === 'neutral') basePrice = pricing.neutralShirtPrice;
    
    let customizationFee = '0';
    if (options?.playerName) {
      customizationFee = (BigInt(customizationFee) + BigInt(pricing.customNameFee)).toString();
    }
    if (options?.playerNumber !== undefined) {
      customizationFee = (BigInt(customizationFee) + BigInt(pricing.customNumberFee)).toString();
    }

    const totalPrice = (
      BigInt(basePrice) + 
      BigInt(customizationFee) + 
      BigInt(pricing.shippingFee)
    ).toString();

    const order: ShirtOrder = {
      orderId,
      teamId,
      teamName,
      fanAddress,
      jerseyType,
      size,
      playerName: options?.playerName,
      playerNumber: options?.playerNumber,
      basePrice,
      customizationFee,
      shippingFee: pricing.shippingFee,
      totalPrice,
      currency: pricing.currency,
      status: 'pending',
      orderDate: Date.now(),
      shippingAddress,
    };

    this.orders.set(orderId, order);
    
    // Track by team
    const teamOrderList = this.teamOrders.get(teamId) || [];
    teamOrderList.push(orderId);
    this.teamOrders.set(teamId, teamOrderList);
    
    // Track by fan
    const fanOrderList = this.fanOrders.get(fanAddress) || [];
    fanOrderList.push(orderId);
    this.fanOrders.set(fanAddress, fanOrderList);
    
    this.saveToStorage();
    return order;
  }

  /**
   * Confirm order (after payment)
   */
  confirmOrder(orderId: string, transactionHash: string): ShirtOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== 'pending') {
      throw new Error(`Order ${orderId} is not pending`);
    }

    order.status = 'confirmed';
    order.confirmedDate = Date.now();
    order.transactionHash = transactionHash;
    
    this.saveToStorage();
    return order;
  }

  /**
   * Update order status
   */
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: {
      trackingNumber?: string;
      ipfsHash?: string;
    }
  ): ShirtOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.status = status;
    
    if (status === 'shipped') {
      order.shippedDate = Date.now();
      if (metadata?.trackingNumber) {
        order.trackingNumber = metadata.trackingNumber;
      }
    }
    
    if (status === 'delivered') {
      order.deliveredDate = Date.now();
    }
    
    if (metadata?.ipfsHash) {
      order.ipfsMetadataHash = metadata.ipfsHash;
    }
    
    this.saveToStorage();
    return order;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): ShirtOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get all orders for a team
   */
  getTeamOrders(teamId: string): ShirtOrder[] {
    const orderIds = this.teamOrders.get(teamId) || [];
    return orderIds
      .map(id => this.orders.get(id))
      .filter((order): order is ShirtOrder => order !== undefined);
  }

  /**
   * Get all orders by a fan
   */
  getFanOrders(fanAddress: string): ShirtOrder[] {
    const orderIds = this.fanOrders.get(fanAddress) || [];
    return orderIds
      .map(id => this.orders.get(id))
      .filter((order): order is ShirtOrder => order !== undefined);
  }

  /**
   * Get team revenue from merchandise
   */
  getTeamRevenue(teamId: string): {
    totalOrders: number;
    totalRevenue: string;
    revenueByType: Record<JerseyType, string>;
    royaltyEarned: string;
  } {
    const teamOrders = this.getTeamOrders(teamId);
    const pricing = this.teamPricing.get(teamId);
    
    let totalRevenue = BigInt(0);
    const revenueByType: Record<JerseyType, string> = {
      home: '0',
      away: '0',
      neutral: '0',
    };

    for (const order of teamOrders) {
      if (order.status === 'confirmed' || order.status === 'processing' || 
          order.status === 'shipped' || order.status === 'delivered') {
        totalRevenue += BigInt(order.totalPrice);
        revenueByType[order.jerseyType] = (
          BigInt(revenueByType[order.jerseyType]) + BigInt(order.totalPrice)
        ).toString();
      }
    }

    const royaltyEarned = pricing
      ? ((totalRevenue * BigInt(pricing.royaltyPercentage)) / BigInt(100)).toString()
      : '0';

    return {
      totalOrders: teamOrders.length,
      totalRevenue: totalRevenue.toString(),
      revenueByType,
      royaltyEarned,
    };
  }

  /**
   * Cancel order
   */
  cancelOrder(orderId: string, reason: string): ShirtOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    
    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error(`Cannot cancel order ${orderId} - already ${order.status}`);
    }

    order.status = 'cancelled';
    this.saveToStorage();
    return order;
  }

  /**
   * Get popular jerseys for a team
   */
  getPopularJerseys(teamId: string): {
    type: JerseyType;
    orderCount: number;
    revenue: string;
  }[] {
    const teamOrders = this.getTeamOrders(teamId);
    const stats = new Map<JerseyType, { count: number; revenue: bigint }>();

    for (const order of teamOrders) {
      if (order.status === 'cancelled') continue;
      
      const current = stats.get(order.jerseyType) || { count: 0, revenue: BigInt(0) };
      current.count++;
      current.revenue += BigInt(order.totalPrice);
      stats.set(order.jerseyType, current);
    }

    return Array.from(stats.entries())
      .map(([type, { count, revenue }]) => ({
        type,
        orderCount: count,
        revenue: revenue.toString(),
      }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const ordersData = localStorage.getItem('fan_merchandise_orders');
      const pricingData = localStorage.getItem('fan_merchandise_pricing');
      const teamOrdersData = localStorage.getItem('fan_merchandise_team_orders');
      const fanOrdersData = localStorage.getItem('fan_merchandise_fan_orders');

      if (ordersData) {
        const parsed = JSON.parse(ordersData);
        this.orders = new Map(Object.entries(parsed));
      }
      
      if (pricingData) {
        const parsed = JSON.parse(pricingData);
        this.teamPricing = new Map(Object.entries(parsed));
      }
      
      if (teamOrdersData) {
        const parsed = JSON.parse(teamOrdersData);
        this.teamOrders = new Map(Object.entries(parsed));
      }
      
      if (fanOrdersData) {
        const parsed = JSON.parse(fanOrdersData);
        this.fanOrders = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading fan merchandise data:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(
        'fan_merchandise_orders',
        JSON.stringify(Object.fromEntries(this.orders))
      );
      localStorage.setItem(
        'fan_merchandise_pricing',
        JSON.stringify(Object.fromEntries(this.teamPricing))
      );
      localStorage.setItem(
        'fan_merchandise_team_orders',
        JSON.stringify(Object.fromEntries(this.teamOrders))
      );
      localStorage.setItem(
        'fan_merchandise_fan_orders',
        JSON.stringify(Object.fromEntries(this.fanOrders))
      );
    } catch (error) {
      console.error('Error saving fan merchandise data:', error);
    }
  }
}
