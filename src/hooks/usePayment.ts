'use client';
import { useState, useEffect, useCallback } from 'react';
import subscriptionSystem from '@/lib/subscriptionSystem';
import shopSystem from '@/lib/shopSystem';
import battlePassSystem from '@/lib/battlePassSystem';

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    setTiers(subscriptionSystem.getAllTiers());
    if (userId) {
      const sub = subscriptionSystem.getSubscription(userId);
      setSubscription(sub);
    }
  }, [userId]);

  const upgradeTier = useCallback((newTier: string) => {
    if (!userId) return false;
    return subscriptionSystem.confirmUpgrade(userId, newTier as any);
  }, [userId]);

  const getPrice = useCallback((tier: string, period: string) => {
    return subscriptionSystem.getPrice(tier as any, period as any);
  }, []);

  return { subscription, tiers, upgradeTier, getPrice };
}

export function useShop(userId?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [cartTotal, setCartTotal] = useState({ subtotal: 0, discount: 0, total: 0 });

  useEffect(() => {
    setItems(shopSystem.getAllItems());
    if (userId) {
      setCart(shopSystem.getCart(userId));
      setInventory(shopSystem.getInventory(userId));
      setCartTotal(shopSystem.getCartTotal(userId));
    }
  }, [userId]);

  const addToCart = useCallback((itemId: string, qty: number = 1) => {
    if (!userId) return false;
    const result = shopSystem.addToCart(userId, itemId, qty);
    if (result) {
      setCart(shopSystem.getCart(userId));
      setCartTotal(shopSystem.getCartTotal(userId));
    }
    return result;
  }, [userId]);

  const purchase = useCallback(() => {
    if (!userId) return null;
    const result = shopSystem.purchaseFromCart(userId, 'card');
    if (result) {
      setCart([]);
      setCartTotal({ subtotal: 0, discount: 0, total: 0 });
      setInventory(shopSystem.getInventory(userId));
    }
    return result;
  }, [userId]);

  const equipItem = useCallback((itemId: string) => {
    if (!userId) return false;
    const result = shopSystem.equipItem(userId, itemId);
    if (result) setInventory(shopSystem.getInventory(userId));
    return result;
  }, [userId]);

  return { items, cart, inventory, cartTotal, addToCart, purchase, equipItem };
}

export function useBattlePass(userId?: string) {
  const [progress, setProgress] = useState<any>(null);
  const [season, setSeason] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    const currentSeason = battlePassSystem.getCurrentSeason();
    setSeason(currentSeason);
    if (currentSeason) setChallenges(battlePassSystem.getChallenges(currentSeason.id));
    if (userId) setProgress(battlePassSystem.getPlayerProgress(userId));
  }, [userId]);

  const addXP = useCallback((amount: number) => {
    if (!userId) return { leveledUp: false, newLevel: 1 };
    const result = battlePassSystem.addXP(userId, amount);
    const prog = battlePassSystem.getPlayerProgress(userId);
    setProgress(prog);
    return result;
  }, [userId]);

  const completeChallenge = useCallback((challengeId: string) => {
    if (!userId) return false;
    const result = battlePassSystem.completeChallenge(userId, challengeId);
    if (result) setProgress(battlePassSystem.getPlayerProgress(userId));
    return result;
  }, [userId]);

  return { progress, season, challenges, addXP, completeChallenge };
}

export function useMonetizationStats() {
  const [subStats, setSubStats] = useState<any>(null);
  const [shopStats, setShopStats] = useState<any>(null);
  const [bpStats, setBpStats] = useState<any>(null);

  useEffect(() => {
    setSubStats(subscriptionSystem.getStats());
    setShopStats(shopSystem.getStats());
    setBpStats(battlePassSystem.getStats());
  }, []);

  return { subStats, shopStats, bpStats };
}
