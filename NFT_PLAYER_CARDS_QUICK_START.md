# NFT Player Cards - Quick Start Guide

Get started with NFT player cards in 5 minutes.

---

## Installation

```bash
# Copy the NFT Player Cards system to your project
# Files: lib/nftPlayerCards.ts, components/NFTPlayerCard.tsx
```

## Basic Usage

### 1. Create a Card

```typescript
import { createPlayerCard } from './lib/nftPlayerCards';

const card = createPlayerCard(
  'player_messi',
  'Lionel Messi',
  'Miami United',
  'Left Winger',
  {
    pace: 82,
    shooting: 90,
    defense: 40,
  },
  'legendary'
);

console.log(card.tokenId);  // "nft_player_..." 
console.log(card.rarity);   // "legendary"
console.log(card.stats);    // { pace: 82, shooting: 90, defense: 40 }
```

### 2. Upgrade a Stat

```typescript
import { upgradePlayerCardStat } from './lib/nftPlayerCards';

const upgraded = upgradePlayerCardStat(
  card.tokenId,
  'pace',           // Upgrade pace from 82 → 83
  'wallet_address'
);

console.log(upgraded.stats.pace);      // 83
console.log(upgraded.upgradesUsed);    // 1
console.log(upgraded.upgradeHistory);  // [{ stat: 'pace', previousValue: 82, newValue: 83, ... }]
```

### 3. Transfer Card

```typescript
import { transferPlayerCard } from './lib/nftPlayerCards';

const transferred = transferPlayerCard(
  card.tokenId,
  'new_owner_wallet',
  'current_owner_wallet'
);

console.log(transferred.owner);           // 'new_owner_wallet'
console.log(transferred.previousOwners);  // [issuer, current_owner, new_owner]
```

### 4. Get Card Information

```typescript
import NFTPlayerCardManager from './lib/nftPlayerCards';

const manager = NFTPlayerCardManager.getInstance();

// Get single card
const myCard = manager.getCard('nft_player_xyz');

// Get all cards for a player
const messiCards = manager.getPlayerCards('player_messi');

// Get all my cards
const myCards = manager.getOwnersCards('my_wallet');

// Get all legendary cards
const legendaries = manager.getCardsByRarity('legendary');

// Get card rating (0-99)
const rating = manager.calculateCardRating(myCard);
// Returns average of pace, shooting, defense

// Compare two cards
const comparison = manager.compareCards(card1, card2);
console.log(comparison.winner);  // Winner based on rating
```

### 5. Display Card in React

```tsx
import { NFTPlayerCardDisplay } from './components/NFTPlayerCard';

// Show card with actions
<NFTPlayerCardDisplay 
  card={card} 
  showActions={true}
  onUpgrade={(tokenId, stat) => console.log(`Upgraded ${stat}`)}
  onTransfer={(tokenId, newOwner) => console.log(`Transferred to ${newOwner}`)}
/>

// Show compact card
<NFTPlayerCardDisplay card={card} compact={true} />
```

---

## Rarity Tiers

Different rarities have different stat caps and upgrade limits:

| Rarity | Pace Cap | Shooting Cap | Defense Cap | Max Upgrades |
|--------|----------|--------------|-------------|--------------|
| 🔵 Common | 65 | 65 | 65 | 3 |
| 🟢 Uncommon | 75 | 75 | 75 | 5 |
| 🟣 Rare | 85 | 85 | 85 | 8 |
| 🟠 Epic | 92 | 92 | 92 | 12 |
| 🟡 Legendary | 99 | 99 | 99 | 20 |

---

## Common Patterns

### Display Player's Collection

```tsx
import { NFTPlayerCardCollection } from './components/NFTPlayerCard';

function MyCards({ playerId }) {
  const manager = NFTPlayerCardManager.getInstance();
  const cards = manager.getPlayerCards(playerId);

  return (
    <NFTPlayerCardCollection cards={cards} />
  );
}
```

### Create Multiple Cards

```typescript
const playerNames = ['Messi', 'Ronaldo', 'Neymar'];
const teams = ['Miami', 'Saudi', 'PSG'];

playerNames.forEach((name, i) => {
  createPlayerCard(
    `player_${i}`,
    name,
    teams[i],
    'Striker',
    {
      pace: 70 + Math.random() * 20,
      shooting: 75 + Math.random() * 15,
      defense: 30 + Math.random() * 20,
    },
    Math.random() > 0.7 ? 'legendary' : 'epic'
  );
});
```

### Lock/Unlock Cards

```typescript
const manager = NFTPlayerCardManager.getInstance();

// Lock card (not transferable)
manager.lockCard(card.tokenId);

// Unlock card (transferable again)
manager.unlockCard(card.tokenId);
```

### Export Card Data

```typescript
const cardData = manager.exportCard(card.tokenId);
// Returns JSON string of card
// Can be saved, shared, or stored
```

### Generate Metadata for Blockchain

```typescript
const metadata = manager.generateMetadata(card);
// {
//   name: "Lionel Messi - LEGENDARY Card",
//   description: "Overall Rating: 87",
//   image: "...",
//   attributes: [
//     { trait_type: "Pace", value: 82 },
//     { trait_type: "Shooting", value: 90 },
//     { trait_type: "Defense", value: 40 },
//     { trait_type: "Overall Rating", value: 87 },
//     { trait_type: "Rarity", value: "Legendary" }
//   ]
// }
```

---

## Upgrade Costs

Each upgrade costs more than the last:

```
Cost = (upgradesUsed + 1) * 10 * rarityMultiplier

Examples:
- Common card, 1st upgrade: 1 * 10 * 1 = 10 credits
- Common card, 3rd upgrade: 3 * 10 * 1 = 30 credits (max)
- Epic card, 1st upgrade: 1 * 10 * 4 = 40 credits
- Epic card, 12th upgrade: 12 * 10 * 4 = 480 credits (max)
- Legendary card, 1st upgrade: 1 * 10 * 5 = 50 credits
- Legendary card, 20th upgrade: 20 * 10 * 5 = 1000 credits (max)
```

---

## Tips & Best Practices

✅ **Use Singleton Manager** - Always use `getInstance()` to avoid duplicates
✅ **Check Transferability** - Cards can be locked from transfer
✅ **Track Upgrades** - Upgrade history is immutable
✅ **Respect Limits** - Don't exceed rarity stat caps
✅ **Validate Owner** - Always verify owner before transfer
✅ **Export Backups** - Use `exportCard()` to save card data
✅ **Generate Metadata** - Create metadata for blockchain minting

---

## Troubleshooting

**Q: Can't upgrade a stat?**
- Check rarity stat cap (e.g., Common = 65 max)
- Check remaining upgrades (e.g., Common = 3 max)
- Ensure wallet has upgrade cost in credits

**Q: Card won't transfer?**
- Check if card is locked
- Verify you're the owner
- Ensure recipient address is valid

**Q: Lost card data?**
- Check localStorage > Application > nft_player_cards
- Use manager.getAllCards() to see all cards
- Cards persist across page refreshes

**Q: Need card for blockchain?**
- Use manager.generateMetadata(card)
- Returns NFT-standard metadata
- Can be minted to ERC721

---

## Next Steps

1. **Create Some Cards** - Add test cards for your players
2. **Build UI** - Use NFTPlayerCardDisplay component
3. **Add Game Integration** - Reward cards for matches
4. **Setup Marketplace** - Buy/sell cards
5. **Deploy Blockchain** - Mint cards to blockchain

---

See [Full Technical Documentation](./NFT_PLAYER_CARDS_TECHNICAL.md) for complete API reference.
