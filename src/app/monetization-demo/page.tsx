'use client';
import { useState } from 'react';
import { useSubscription, useShop, useBattlePass, useMonetizationStats } from '@/src/hooks/usePayment';
import styles from './page.module.css';

export default function MonetizationDemo() {
  const userId = 'demo_user_1';
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [selectedTier, setSelectedTier] = useState('starter');

  const { subscription, tiers, getPrice } = useSubscription(userId);
  const { items, cart, cartTotal, addToCart, purchase, inventory } = useShop(userId);
  const { progress, season, challenges } = useBattlePass(userId);
  const { subStats, shopStats, bpStats } = useMonetizationStats();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Payment & Monetization System</h1>
        <p>Subscriptions • Shop • Battle Pass • Revenue Tracking</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'subscriptions' ? styles.active : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          💎 Subscriptions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'shop' ? styles.active : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🛍️ Shop
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'battlepass' ? styles.active : ''}`}
          onClick={() => setActiveTab('battlepass')}
        >
          🎮 Battle Pass
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {activeTab === 'subscriptions' && (
        <div className={styles.section}>
          <h2>Subscription Tiers</h2>
          <p>Current Subscription: {subscription?.tier?.toUpperCase() || 'FREE'}</p>
          <div className={styles.tierGrid}>
            {tiers.map((tier: any) => (
              <div
                key={tier.id}
                className={`${styles.tierCard} ${subscription?.tier === tier.id ? styles.selected : ''}`}
              >
                <div className={styles.tierIcon}>{tier.icon}</div>
                <h3>{tier.name}</h3>
                <p>{tier.description}</p>
                <div className={styles.price}>
                  ${getPrice(tier.id, 'monthly')}
                  <span>/month</span>
                </div>
                <div className={styles.features}>
                  {tier.features.slice(0, 4).map((f: any, i: number) => (
                    <div key={i} className={styles.feature}>
                      {f.included ? '✓' : '✗'} {f.name}
                    </div>
                  ))}
                </div>
                {subscription?.tier !== tier.id && (
                  <button className={styles.btn} onClick={() => setSelectedTier(tier.id)}>
                    Select {tier.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className={styles.section}>
          <h2>In-Game Shop</h2>
          <div className={styles.shopLayout}>
            <div className={styles.itemsGrid}>
              {items.map((item: any) => (
                <div key={item.id} className={styles.shopItem}>
                  <div className={styles.itemIcon}>{item.icon}</div>
                  <h4>{item.name}</h4>
                  <p className={styles.rarity}>{item.rarity}</p>
                  <div className={styles.price}>${item.price}</div>
                  <button className={styles.btn} onClick={() => addToCart(item.id)}>
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.cartPanel}>
              <h3>Shopping Cart</h3>
              <p>Items: {cart.length}</p>
              {cart.length > 0 ? (
                <>
                  {cart.map((item: any) => (
                    <div key={item.itemId} className={styles.cartItem}>
                      <span>{item.itemId}</span>
                      <span>x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className={styles.cartTotal}>
                    <div>Subtotal: ${cartTotal.subtotal.toFixed(2)}</div>
                    <div>Discount: -${cartTotal.discount.toFixed(2)}</div>
                    <div className={styles.finalTotal}>Total: ${cartTotal.total.toFixed(2)}</div>
                  </div>
                  <button className={`${styles.btn} ${styles.primary}`} onClick={purchase}>
                    Complete Purchase
                  </button>
                </>
              ) : (
                <p>Cart is empty</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'battlepass' && (
        <div className={styles.section}>
          <h2>Battle Pass</h2>
          {season ? (
            <>
              <div className={styles.seasonInfo}>
                <h3>{season.name}</h3>
                <p>{season.passDescription}</p>
                <div className={styles.seasonMeta}>
                  <span>Theme: {season.theme}</span>
                  <span>Levels: {season.totalLevels}</span>
                  <span>Price: ${season.premiumPrice}</span>
                </div>
              </div>

              {progress && (
                <div className={styles.progressCard}>
                  <h4>Your Progress</h4>
                  <div className={styles.levelInfo}>
                    <span>Level: {progress.currentLevel}</span>
                    <span>XP: {progress.currentXP}</span>
                    <span>Tier: {progress.tier.toUpperCase()}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(progress.currentXP / (progress.currentLevel * 1000)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className={styles.challengesGrid}>
                <h4>Active Challenges</h4>
                {challenges.map((challenge: any) => (
                  <div key={challenge.id} className={styles.challengeItem}>
                    <div className={styles.challengeIcon}>{challenge.icon}</div>
                    <h5>{challenge.name}</h5>
                    <p>{challenge.description}</p>
                    <p className={styles.reward}>+{challenge.xpReward} XP</p>
                    <div className={styles.difficulty}>{challenge.difficulty}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>No active season</p>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.section}>
          <h2>Monetization Analytics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h4>Subscriptions</h4>
              <div className={styles.stat}>
                <span>Active Subscribers:</span>
                <strong>{subStats?.activeSubscribers || 0}</strong>
              </div>
              <div className={styles.stat}>
                <span>Total Revenue:</span>
                <strong>${(subStats?.totalRevenue || 0).toFixed(2)}</strong>
              </div>
              <div className={styles.stat}>
                <span>Avg Revenue/User:</span>
                <strong>${(subStats?.averageRevenuePerUser || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div className={styles.statCard}>
              <h4>Shop</h4>
              <div className={styles.stat}>
                <span>Total Players:</span>
                <strong>{shopStats?.totalPlayers || 0}</strong>
              </div>
              <div className={styles.stat}>
                <span>Items Sold:</span>
                <strong>{shopStats?.totalItemsSold || 0}</strong>
              </div>
              <div className={styles.stat}>
                <span>Avg Order Value:</span>
                <strong>${(shopStats?.averageOrderValue || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div className={styles.statCard}>
              <h4>Battle Pass</h4>
              <div className={styles.stat}>
                <span>Players Enrolled:</span>
                <strong>{bpStats?.totalPlayersEnrolled || 0}</strong>
              </div>
              <div className={styles.stat}>
                <span>Premium Players:</span>
                <strong>{bpStats?.premiumSubscribers || 0}</strong>
              </div>
              <div className={styles.stat}>
                <span>Avg Player Level:</span>
                <strong>{(bpStats?.averagePlayerLevel || 0).toFixed(1)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
