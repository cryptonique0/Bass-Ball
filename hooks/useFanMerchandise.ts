import { useState, useCallback, useEffect } from 'react';
import { FanMerchandiseManager, ShirtOrder, TeamMerchandisePricing, JerseyType, ShirtSize } from '../lib/fanMerchandise';

/**
 * React hook for fan merchandise system
 */
export function useFanMerchandise(teamId?: string, fanAddress?: string) {
  const [merchandiseManager] = useState(() => FanMerchandiseManager.getInstance());
  const [teamOrders, setTeamOrders] = useState<ShirtOrder[]>([]);
  const [fanOrders, setFanOrders] = useState<ShirtOrder[]>([]);
  const [teamPricing, setTeamPricing] = useState<TeamMerchandisePricing | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load team orders
  const loadTeamOrders = useCallback(() => {
    if (!teamId) return;
    try {
      const orders = merchandiseManager.getTeamOrders(teamId);
      setTeamOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team orders');
    }
  }, [teamId, merchandiseManager]);

  // Load fan orders
  const loadFanOrders = useCallback(() => {
    if (!fanAddress) return;
    try {
      const orders = merchandiseManager.getFanOrders(fanAddress);
      setFanOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fan orders');
    }
  }, [fanAddress, merchandiseManager]);

  // Load team pricing
  const loadTeamPricing = useCallback(() => {
    if (!teamId) return;
    try {
      const pricing = merchandiseManager.getTeamPricing(teamId);
      setTeamPricing(pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team pricing');
    }
  }, [teamId, merchandiseManager]);

  // Create shirt order
  const createOrder = useCallback(
    async (
      teamName: string,
      jerseyType: JerseyType,
      size: ShirtSize,
      shippingAddress: ShirtOrder['shippingAddress'],
      options?: { playerName?: string; playerNumber?: number }
    ): Promise<ShirtOrder | null> => {
      if (!teamId || !fanAddress) {
        setError('Team ID and fan address are required');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const order = merchandiseManager.createShirtOrder(
          teamId,
          teamName,
          fanAddress,
          jerseyType,
          size,
          shippingAddress,
          options
        );

        loadFanOrders();
        loadTeamOrders();
        return order;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create order');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [teamId, fanAddress, merchandiseManager, loadFanOrders, loadTeamOrders]
  );

  // Confirm order
  const confirmOrder = useCallback(
    async (orderId: string, transactionHash: string): Promise<ShirtOrder | null> => {
      setLoading(true);
      setError(null);

      try {
        const order = merchandiseManager.confirmOrder(orderId, transactionHash);
        loadFanOrders();
        loadTeamOrders();
        return order;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to confirm order');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [merchandiseManager, loadFanOrders, loadTeamOrders]
  );

  // Update order status
  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: ShirtOrder['status'],
      metadata?: { trackingNumber?: string; ipfsHash?: string }
    ): Promise<ShirtOrder | null> => {
      setLoading(true);
      setError(null);

      try {
        const order = merchandiseManager.updateOrderStatus(orderId, status, metadata);
        loadFanOrders();
        loadTeamOrders();
        return order;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update order status');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [merchandiseManager, loadFanOrders, loadTeamOrders]
  );

  // Cancel order
  const cancelOrder = useCallback(
    async (orderId: string, reason: string): Promise<ShirtOrder | null> => {
      setLoading(true);
      setError(null);

      try {
        const order = merchandiseManager.cancelOrder(orderId, reason);
        loadFanOrders();
        loadTeamOrders();
        return order;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel order');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [merchandiseManager, loadFanOrders, loadTeamOrders]
  );

  // Set team pricing
  const setTeamPricing = useCallback(
    async (pricing: Omit<TeamMerchandisePricing, 'teamId'>): Promise<TeamMerchandisePricing | null> => {
      if (!teamId) {
        setError('Team ID is required');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = merchandiseManager.setTeamPricing(teamId, pricing);
        loadTeamPricing();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set team pricing');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [teamId, merchandiseManager, loadTeamPricing]
  );

  // Get team revenue
  const getTeamRevenue = useCallback(() => {
    if (!teamId) return null;
    try {
      return merchandiseManager.getTeamRevenue(teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get team revenue');
      return null;
    }
  }, [teamId, merchandiseManager]);

  // Get popular jerseys
  const getPopularJerseys = useCallback(() => {
    if (!teamId) return [];
    try {
      return merchandiseManager.getPopularJerseys(teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get popular jerseys');
      return [];
    }
  }, [teamId, merchandiseManager]);

  // Load data on mount
  useEffect(() => {
    loadTeamOrders();
    loadFanOrders();
    loadTeamPricing();
  }, [loadTeamOrders, loadFanOrders, loadTeamPricing]);

  return {
    // State
    teamOrders,
    fanOrders,
    teamPricing,
    loading,
    error,

    // Actions
    createOrder,
    confirmOrder,
    updateOrderStatus,
    cancelOrder,
    setTeamPricing,
    
    // Analytics
    getTeamRevenue,
    getPopularJerseys,

    // Refresh
    refresh: () => {
      loadTeamOrders();
      loadFanOrders();
      loadTeamPricing();
    },
  };
}
