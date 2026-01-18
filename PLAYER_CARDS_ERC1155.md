# Player Cards (ERC-1155) for Bass Ball

## Part 1: Core Interface & Design

### Overview

**ERC-1155 fungible cards** represent:
- **Footballers**: Player cards with stat boosts (speed, strength, accuracy)
- **Consumables**: Single-use items (stamina restore, power-up, protection)
- **Upgrades**: Permanent team improvements (better training, equipment)

Multiple copies of each card can be owned. Cards are tradeable on secondary markets.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPlayerCard {
    enum CardType {
        FOOTBALLER,     // Player card (stat boost)
        CONSUMABLE,     // Single-use item
        UPGRADE         // Permanent improvement
    }

    enum Rarity {
        COMMON,         // 1.0x stats (100% common rate)
        UNCOMMON,       // 1.1x stats (25% from packs)
        RARE,          // 1.2x stats (5% from packs)
        EPIC,          // 1.4x stats (1% from packs)
        LEGENDARY      // 1.6x stats (0.1% from packs)
    }

    struct CardData {
        uint256 cardId;
        CardType cardType;
        Rarity rarity;
        string name;
        string description;
        string imageURI;           // IPFS hash
        uint64 createdAt;
        bool isActive;
    }

    struct FootballerCard {
        uint256 cardId;
        uint8 speed;               // 0-100
        uint8 strength;            // 0-100
        uint8 accuracy;            // 0-100
        uint8 stamina;             // 0-100
        uint8 dribbling;           // 0-100
        uint16 ratingBoost;        // ELO points
        uint8 statMultiplier;      // 100 = 1.0x, 160 = 1.6x
    }

    struct ConsumableCard {
        uint256 cardId;
        uint8 effect;              // 0=stamina restore, 1=speed boost, 2=protection
        uint8 power;               // Effect strength (0-100)
        uint16 duration;           // Ticks effect lasts
    }

    struct UpgradeCard {
        uint256 cardId;
        uint8 upgradeType;         // 0=training, 1=equipment, 2=facility
        string benefit;            // Description of benefit
        uint32 costUSDC;           // USDC to unlock
        bool isPermanent;          // True if one-time unlock
    }

    event CardMinted(
        address indexed to,
        uint256 indexed cardId,
        uint256 amount,
        CardType cardType,
        Rarity rarity
    );

    event CardBurned(
        address indexed from,
        uint256 indexed cardId,
        uint256 amount
    );

    event CardUpgraded(
        uint256 indexed cardId,
        Rarity newRarity
    );

    event CardUsed(
        address indexed player,
        uint256 indexed cardId,
        uint256 amount
    );

    /// Mint cards (batch)
    function mintCard(
        address to,
        uint256 cardId,
        uint256 amount
    ) external;

    function mintBatch(
        address to,
        uint256[] calldata cardIds,
        uint256[] calldata amounts
    ) external;

    /// Burn cards (remove from circulation)
    function burnCard(
        address from,
        uint256 cardId,
        uint256 amount
    ) external;

    function burnBatch(
        address from,
        uint256[] calldata cardIds,
        uint256[] calldata amounts
    ) external;

    /// Get card data
    function getCardData(uint256 cardId)
        external
        view
        returns (CardData memory);

    /// Get footballer stats
    function getFootballerCard(uint256 cardId)
        external
        view
        returns (FootballerCard memory);

    /// Get consumable effect
    function getConsumableCard(uint256 cardId)
        external
        view
        returns (ConsumableCard memory);

    /// Get upgrade details
    function getUpgradeCard(uint256 cardId)
        external
        view
        returns (UpgradeCard memory);

    /// Get player's collection
    function getPlayerCollection(address player)
        external
        view
        returns (uint256[] memory cardIds, uint256[] memory balances);

    /// Get rarity multiplier
    function getStatMultiplier(uint256 cardId)
        external
        view
        returns (uint8 multiplier);

    /// ERC1155 standard transfers
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external;

    /// ERC1155 interface
    function balanceOf(address account, uint256 id)
        external
        view
        returns (uint256);

    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory);

    function setApprovalForAll(address operator, bool approved) external;

    function isApprovedForAll(address account, address operator)
        external
        view
        returns (bool);
}
```

---

## Part 2: Complete ERC-1155 Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./IPlayerCard.sol";

contract BassBallPlayerCard is ERC1155, AccessControl, IPlayerCard {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Card registry
    mapping(uint256 => CardData) public cardData;
    mapping(uint256 => FootballerCard) public footballerCards;
    mapping(uint256 => ConsumableCard) public consumableCards;
    mapping(uint256 => UpgradeCard) public upgradeCards;

    // Player collections
    mapping(address => uint256[]) public playerCardIds;
    mapping(address => mapping(uint256 => bool)) public playerHasCard;

    // Supply tracking
    mapping(uint256 => uint256) public totalSupply;
    mapping(uint256 => uint256) public maxSupply;

    uint256 private cardIdCounter = 0;
    string public baseURI;

    constructor(string memory _baseURI) ERC1155("") {
        baseURI = _baseURI;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    /**
     * ==================== MINTING ====================
     */

    /**
     * Mint a new card type
     */
    function createFootballerCard(
        string calldata name,
        string calldata description,
        string calldata imageURI,
        uint8 speed,
        uint8 strength,
        uint8 accuracy,
        uint8 stamina,
        uint8 dribbling,
        uint16 ratingBoost,
        Rarity rarity,
        uint256 _maxSupply
    ) external onlyRole(MINTER_ROLE) returns (uint256 newCardId) {
        newCardId = ++cardIdCounter;

        cardData[newCardId] = CardData({
            cardId: newCardId,
            cardType: CardType.FOOTBALLER,
            rarity: rarity,
            name: name,
            description: description,
            imageURI: imageURI,
            createdAt: uint64(block.timestamp),
            isActive: true
        });

        uint8 multiplier = _getMultiplier(rarity);

        footballerCards[newCardId] = FootballerCard({
            cardId: newCardId,
            speed: speed,
            strength: strength,
            accuracy: accuracy,
            stamina: stamina,
            dribbling: dribbling,
            ratingBoost: ratingBoost,
            statMultiplier: multiplier
        });

        maxSupply[newCardId] = _maxSupply;

        return newCardId;
    }

    function createConsumableCard(
        string calldata name,
        string calldata description,
        string calldata imageURI,
        uint8 effect,
        uint8 power,
        uint16 duration,
        uint256 _maxSupply
    ) external onlyRole(MINTER_ROLE) returns (uint256 newCardId) {
        newCardId = ++cardIdCounter;

        cardData[newCardId] = CardData({
            cardId: newCardId,
            cardType: CardType.CONSUMABLE,
            rarity: Rarity.COMMON,
            name: name,
            description: description,
            imageURI: imageURI,
            createdAt: uint64(block.timestamp),
            isActive: true
        });

        consumableCards[newCardId] = ConsumableCard({
            cardId: newCardId,
            effect: effect,
            power: power,
            duration: duration
        });

        maxSupply[newCardId] = _maxSupply;

        return newCardId;
    }

    function createUpgradeCard(
        string calldata name,
        string calldata description,
        string calldata imageURI,
        uint8 upgradeType,
        string calldata benefit,
        uint32 costUSDC,
        bool isPermanent,
        uint256 _maxSupply
    ) external onlyRole(MINTER_ROLE) returns (uint256 newCardId) {
        newCardId = ++cardIdCounter;

        cardData[newCardId] = CardData({
            cardId: newCardId,
            cardType: CardType.UPGRADE,
            rarity: Rarity.UNCOMMON,
            name: name,
            description: description,
            imageURI: imageURI,
            createdAt: uint64(block.timestamp),
            isActive: true
        });

        upgradeCards[newCardId] = UpgradeCard({
            cardId: newCardId,
            upgradeType: upgradeType,
            benefit: benefit,
            costUSDC: costUSDC,
            isPermanent: isPermanent
        });

        maxSupply[newCardId] = _maxSupply;

        return newCardId;
    }

    /**
     * Mint cards to player
     */
    function mintCard(
        address to,
        uint256 cardId,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Invalid address");
        require(cardData[cardId].isActive, "Card not found");
        require(
            totalSupply[cardId] + amount <= maxSupply[cardId],
            "Exceeds max supply"
        );

        _mint(to, cardId, amount, "");

        if (!playerHasCard[to][cardId]) {
            playerCardIds[to].push(cardId);
            playerHasCard[to][cardId] = true;
        }

        totalSupply[cardId] += amount;

        emit CardMinted(to, cardId, amount, cardData[cardId].cardType, cardData[cardId].rarity);
    }

    function mintBatch(
        address to,
        uint256[] calldata cardIds,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Invalid address");
        require(cardIds.length == amounts.length, "Length mismatch");

        for (uint256 i = 0; i < cardIds.length; i++) {
            require(cardData[cardIds[i]].isActive, "Card not found");
            require(
                totalSupply[cardIds[i]] + amounts[i] <= maxSupply[cardIds[i]],
                "Exceeds max supply"
            );

            if (!playerHasCard[to][cardIds[i]]) {
                playerCardIds[to].push(cardIds[i]);
                playerHasCard[to][cardIds[i]] = true;
            }

            totalSupply[cardIds[i]] += amounts[i];
        }

        _mintBatch(to, cardIds, amounts, "");
    }

    /**
     * ==================== BURNING ====================
     */

    function burnCard(
        address from,
        uint256 cardId,
        uint256 amount
    ) external {
        require(
            msg.sender == from || isApprovedForAll(from, msg.sender),
            "Not authorized"
        );

        _burn(from, cardId, amount);
        totalSupply[cardId] -= amount;

        emit CardBurned(from, cardId, amount);
    }

    function burnBatch(
        address from,
        uint256[] calldata cardIds,
        uint256[] calldata amounts
    ) external {
        require(
            msg.sender == from || isApprovedForAll(from, msg.sender),
            "Not authorized"
        );

        _burnBatch(from, cardIds, amounts);

        for (uint256 i = 0; i < cardIds.length; i++) {
            totalSupply[cardIds[i]] -= amounts[i];
        }
    }

    /**
     * ==================== GETTERS ====================
     */

    function getCardData(uint256 cardId)
        external
        view
        returns (CardData memory)
    {
        require(cardData[cardId].isActive, "Card not found");
        return cardData[cardId];
    }

    function getFootballerCard(uint256 cardId)
        external
        view
        returns (FootballerCard memory)
    {
        require(
            cardData[cardId].cardType == CardType.FOOTBALLER,
            "Not a footballer card"
        );
        return footballerCards[cardId];
    }

    function getConsumableCard(uint256 cardId)
        external
        view
        returns (ConsumableCard memory)
    {
        require(
            cardData[cardId].cardType == CardType.CONSUMABLE,
            "Not a consumable card"
        );
        return consumableCards[cardId];
    }

    function getUpgradeCard(uint256 cardId)
        external
        view
        returns (UpgradeCard memory)
    {
        require(
            cardData[cardId].cardType == CardType.UPGRADE,
            "Not an upgrade card"
        );
        return upgradeCards[cardId];
    }

    function getPlayerCollection(address player)
        external
        view
        returns (uint256[] memory cardIds, uint256[] memory balances)
    {
        cardIds = playerCardIds[player];
        balances = new uint256[](cardIds.length);

        for (uint256 i = 0; i < cardIds.length; i++) {
            balances[i] = balanceOf(player, cardIds[i]);
        }
    }

    function getStatMultiplier(uint256 cardId)
        external
        view
        returns (uint8 multiplier)
    {
        if (cardData[cardId].cardType == CardType.FOOTBALLER) {
            return footballerCards[cardId].statMultiplier;
        }
        return 100; // Default 1.0x
    }

    function getCardCount() external view returns (uint256) {
        return cardIdCounter;
    }

    function getCardStats(uint256 cardId)
        external
        view
        returns (
            string memory name,
            Rarity rarity,
            uint256 supply,
            uint256 max
        )
    {
        require(cardData[cardId].isActive, "Card not found");
        return (
            cardData[cardId].name,
            cardData[cardId].rarity,
            totalSupply[cardId],
            maxSupply[cardId]
        );
    }

    /**
     * ==================== URI ====================
     */

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(cardData[tokenId].isActive, "Card not found");

        string memory json = string.concat(
            '{"name":"',
            cardData[tokenId].name,
            '","description":"',
            cardData[tokenId].description,
            '","image":"ipfs://',
            cardData[tokenId].imageURI,
            '","attributes":[',
            _getAttributes(tokenId),
            "]}"
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                _encode(bytes(json))
            )
        );
    }

    function _getAttributes(uint256 tokenId)
        internal
        view
        returns (string memory)
    {
        CardType cardType = cardData[tokenId].cardType;
        Rarity rarity = cardData[tokenId].rarity;

        string memory attrs = string.concat(
            '{"trait_type":"Type","value":"',
            _typeToString(cardType),
            '"},{"trait_type":"Rarity","value":"',
            _rarityToString(rarity),
            '"}'
        );

        if (cardType == CardType.FOOTBALLER) {
            FootballerCard memory card = footballerCards[tokenId];
            attrs = string.concat(
                attrs,
                ',{"trait_type":"Speed","value":',
                Strings.toString(card.speed),
                '},{"trait_type":"Strength","value":',
                Strings.toString(card.strength),
                '},{"trait_type":"Accuracy","value":',
                Strings.toString(card.accuracy),
                '}'
            );
        }

        return attrs;
    }

    /**
     * ==================== ACCESS CONTROL ====================
     */

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * ==================== INTERNAL HELPERS ====================
     */

    function _getMultiplier(Rarity rarity) internal pure returns (uint8) {
        if (rarity == Rarity.COMMON) return 100;
        if (rarity == Rarity.UNCOMMON) return 110;
        if (rarity == Rarity.RARE) return 120;
        if (rarity == Rarity.EPIC) return 140;
        if (rarity == Rarity.LEGENDARY) return 160;
        return 100;
    }

    function _typeToString(CardType cardType)
        internal
        pure
        returns (string memory)
    {
        if (cardType == CardType.FOOTBALLER) return "Footballer";
        if (cardType == CardType.CONSUMABLE) return "Consumable";
        if (cardType == CardType.UPGRADE) return "Upgrade";
        return "Unknown";
    }

    function _rarityToString(Rarity rarity)
        internal
        pure
        returns (string memory)
    {
        if (rarity == Rarity.COMMON) return "Common";
        if (rarity == Rarity.UNCOMMON) return "Uncommon";
        if (rarity == Rarity.RARE) return "Rare";
        if (rarity == Rarity.EPIC) return "Epic";
        if (rarity == Rarity.LEGENDARY) return "Legendary";
        return "Unknown";
    }

    function _encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        bytes memory encoded = new bytes(encodedLen + 32);

        uint256 j = 32;
        uint256 pad = data.length % 3;

        for (uint256 i = 0; i < data.length - pad; i += 3) {
            uint256 n =
                (uint256(uint8(data[i])) << 16) |
                (uint256(uint8(data[i + 1])) << 8) |
                uint256(uint8(data[i + 2]));

            encoded[j++] = bytes(table)[n >> 18];
            encoded[j++] = bytes(table)[(n >> 12) & 63];
            encoded[j++] = bytes(table)[(n >> 6) & 63];
            encoded[j++] = bytes(table)[n & 63];
        }

        if (pad == 1) {
            uint256 n = uint256(uint8(data[data.length - 1])) << 16;
            encoded[j++] = bytes(table)[n >> 18];
            encoded[j++] = bytes(table)[(n >> 12) & 63];
            encoded[j++] = bytes(table)[64];
            encoded[j++] = bytes(table)[64];
        } else if (pad == 2) {
            uint256 n =
                (uint256(uint8(data[data.length - 2])) << 16) |
                (uint256(uint8(data[data.length - 1])) << 8);
            encoded[j++] = bytes(table)[n >> 18];
            encoded[j++] = bytes(table)[(n >> 12) & 63];
            encoded[j++] = bytes(table)[(n >> 6) & 63];
            encoded[j++] = bytes(table)[64];
        }

        return string(encoded);
    }
}
```

---

## Part 3: Footballer Cards (Stats System)

### Card Types & Rarity Rates

```typescript
// lib/cards/footballer-cards.ts
export enum FootballerRarity {
  COMMON = 0,      // 100% - base stats
  UNCOMMON = 1,    // 25% - +10% stats
  RARE = 2,        // 5% - +20% stats
  EPIC = 3,        // 1% - +40% stats
  LEGENDARY = 4,   // 0.1% - +60% stats
}

export interface FootballerStats {
  speed: number;      // 0-100
  strength: number;   // 0-100
  accuracy: number;   // 0-100
  stamina: number;    // 0-100
  dribbling: number;  // 0-100
}

export const DEFAULT_FOOTBALLER_STATS: FootballerStats = {
  speed: 75,
  strength: 70,
  accuracy: 80,
  stamina: 85,
  dribbling: 75,
};

/**
 * Calculate effective stat with rarity multiplier
 */
export function getEffectiveStat(
  baseStat: number,
  rarity: FootballerRarity
): number {
  const multipliers = {
    [FootballerRarity.COMMON]: 1.0,
    [FootballerRarity.UNCOMMON]: 1.1,
    [FootballerRarity.RARE]: 1.2,
    [FootballerRarity.EPIC]: 1.4,
    [FootballerRarity.LEGENDARY]: 1.6,
  };

  return Math.min(100, Math.floor(baseStat * multipliers[rarity]));
}

/**
 * Pre-defined footballer cards
 */
export const FOOTBALLER_CARD_TEMPLATES = {
  speedster: {
    name: "Speedster",
    stats: { speed: 95, strength: 60, accuracy: 75, stamina: 80, dribbling: 85 },
    boost: 50,
  },
  powerhouse: {
    name: "Powerhouse",
    stats: { speed: 70, strength: 95, accuracy: 70, stamina: 85, dribbling: 65 },
    boost: 50,
  },
  striker: {
    name: "Elite Striker",
    stats: { speed: 85, strength: 80, accuracy: 95, stamina: 80, dribbling: 80 },
    boost: 100,
  },
  midfielder: {
    name: "Midfielder",
    stats: { speed: 80, strength: 75, accuracy: 85, stamina: 90, dribbling: 85 },
    boost: 75,
  },
  defender: {
    name: "Defender",
    stats: { speed: 75, strength: 90, accuracy: 80, stamina: 90, dribbling: 70 },
    boost: 60,
  },
};
```

### Pack Opening System

```typescript
// services/card-pack-service.ts
export class CardPackService {
  private weights = {
    [FootballerRarity.COMMON]: 0.65,      // 65%
    [FootballerRarity.UNCOMMON]: 0.25,    // 25%
    [FootballerRarity.RARE]: 0.08,        // 8%
    [FootballerRarity.EPIC]: 0.015,       // 1.5%
    [FootballerRarity.LEGENDARY]: 0.005,  // 0.5%
  };

  /**
   * Open a card pack (5 cards)
   * Guaranteed 1 rare or better
   */
  async openPack(owner: string): Promise<CardPackResult> {
    const cards: CardResult[] = [];

    // Draw 4 random cards
    for (let i = 0; i < 4; i++) {
      const rarity = this.drawRarity();
      const card = this.selectCard(rarity);
      cards.push({
        cardId: card.id,
        rarity,
        name: card.name,
      });
    }

    // Guarantee 1 rare or better
    const rareRarity = this.drawGuaranteedRare();
    const rareCard = this.selectCard(rareRarity);
    cards.push({
      cardId: rareCard.id,
      rarity: rareRarity,
      name: rareCard.name,
    });

    // Mint to player
    for (const card of cards) {
      await this.cardContract.mintCard(owner, card.cardId, 1);
    }

    return {
      owner,
      cards,
      packsOpened: 1,
      timestamp: Date.now(),
    };
  }

  private drawRarity(): FootballerRarity {
    const rand = Math.random();
    let cumulative = 0;

    for (const [rarity, weight] of Object.entries(this.weights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        return parseInt(rarity) as FootballerRarity;
      }
    }

    return FootballerRarity.COMMON;
  }

  private drawGuaranteedRare(): FootballerRarity {
    const rand = Math.random();
    
    // Guaranteed rare or better
    // 60% Uncommon, 35% Rare, 4% Epic, 1% Legendary
    if (rand < 0.6) return FootballerRarity.UNCOMMON;
    if (rand < 0.95) return FootballerRarity.RARE;
    if (rand < 0.99) return FootballerRarity.EPIC;
    return FootballerRarity.LEGENDARY;
  }

  private selectCard(rarity: FootballerRarity): Card {
    // Select from available cards at this rarity
    const pool = this.getCardPool(rarity);
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  private getCardPool(rarity: FootballerRarity): Card[] {
    // Return all cards available at this rarity
    // Would be populated from card registry
    return [];
  }
}

export interface CardPackResult {
  owner: string;
  cards: CardResult[];
  packsOpened: number;
  timestamp: number;
}

export interface CardResult {
  cardId: string;
  rarity: FootballerRarity;
  name: string;
}
```

---

## Part 4: Consumables (Single-Use Items)

```typescript
// lib/cards/consumable-cards.ts
export enum ConsumableEffect {
  STAMINA_RESTORE = 0,  // Restore 30 stamina
  SPEED_BOOST = 1,       // +20% speed for 300 ticks
  PROTECTION = 2,        // Immunity to sliding for 1 match
  ACCURACY_BOOST = 3,    // +30% accuracy for 300 ticks
  STRENGTH_BOOST = 4,    // +25% strength for 300 ticks
}

export interface ConsumableCard {
  id: string;
  effect: ConsumableEffect;
  name: string;
  description: string;
  power: number;       // Effect strength (0-100)
  duration: number;    // Ticks
  cost: number;        // USDC or points to craft
}

export const CONSUMABLE_CARDS: Record<ConsumableEffect, ConsumableCard> = {
  [ConsumableEffect.STAMINA_RESTORE]: {
    id: "stamina-restore",
    effect: ConsumableEffect.STAMINA_RESTORE,
    name: "Energy Potion",
    description: "Restore 30 stamina",
    power: 30,
    duration: 0, // Instant
    cost: 50,
  },

  [ConsumableEffect.SPEED_BOOST]: {
    id: "speed-boost",
    effect: ConsumableEffect.SPEED_BOOST,
    name: "Speed Serum",
    description: "+20% speed for 5 seconds",
    power: 20,
    duration: 300,
    cost: 100,
  },

  [ConsumableEffect.PROTECTION]: {
    id: "protection",
    effect: ConsumableEffect.PROTECTION,
    name: "Shield",
    description: "Immunity to sliding tackle",
    power: 100,
    duration: 2700, // Full match
    cost: 150,
  },

  [ConsumableEffect.ACCURACY_BOOST]: {
    id: "accuracy-boost",
    effect: ConsumableEffect.ACCURACY_BOOST,
    name: "Focus Elixir",
    description: "+30% shot accuracy for 5 seconds",
    power: 30,
    duration: 300,
    cost: 120,
  },

  [ConsumableEffect.STRENGTH_BOOST]: {
    id: "strength-boost",
    effect: ConsumableEffect.STRENGTH_BOOST,
    name: "Strength Tonic",
    description: "+25% strength for 5 seconds",
    power: 25,
    duration: 300,
    cost: 110,
  },
};

/**
 * Track active consumables in match
 */
export class ConsumableManager {
  private activeEffects: Map<
    string,
    { effect: ConsumableEffect; endTick: number }[]
  > = new Map();

  useConsumable(playerId: string, effect: ConsumableEffect, currentTick: number) {
    const card = CONSUMABLE_CARDS[effect];

    if (!this.activeEffects.has(playerId)) {
      this.activeEffects.set(playerId, []);
    }

    this.activeEffects.get(playerId)!.push({
      effect,
      endTick: currentTick + card.duration,
    });

    console.log(`Consumable used: ${card.name} (${playerId})`);
  }

  getActiveEffect(
    playerId: string,
    effect: ConsumableEffect,
    currentTick: number
  ): boolean {
    const effects = this.activeEffects.get(playerId) || [];
    return effects.some(
      (e) => e.effect === effect && e.endTick > currentTick
    );
  }

  applyBoost(playerId: string, stat: string, currentTick: number): number {
    // Calculate bonus from active consumables
    let totalBonus = 1.0;

    const effects = this.activeEffects.get(playerId) || [];
    for (const effect of effects) {
      if (effect.endTick > currentTick) {
        const card = CONSUMABLE_CARDS[effect.effect];
        if (stat === "speed" && effect.effect === ConsumableEffect.SPEED_BOOST) {
          totalBonus *= 1 + card.power / 100;
        }
        if (stat === "strength" && effect.effect === ConsumableEffect.STRENGTH_BOOST) {
          totalBonus *= 1 + card.power / 100;
        }
        if (stat === "accuracy" && effect.effect === ConsumableEffect.ACCURACY_BOOST) {
          totalBonus *= 1 + card.power / 100;
        }
      }
    }

    return totalBonus;
  }

  cleanup(currentTick: number) {
    for (const [playerId, effects] of this.activeEffects.entries()) {
      this.activeEffects.set(
        playerId,
        effects.filter((e) => e.endTick > currentTick)
      );
    }
  }
}
```

---

## Part 5: Upgrades (Permanent Improvements)

```typescript
// lib/cards/upgrade-cards.ts
export enum UpgradeType {
  TRAINING = 0,      // Better training facility
  EQUIPMENT = 1,     // Better equipment
  FACILITY = 2,      // Stadium upgrade
  MEDICAL = 3,       // Faster recovery
}

export interface UpgradeCard {
  id: string;
  type: UpgradeType;
  name: string;
  description: string;
  benefit: string;
  costUSDC: number;
  isPermanent: boolean;
  statBonuses: {
    speed?: number;
    strength?: number;
    stamina?: number;
    accuracy?: number;
  };
}

export const UPGRADE_CARDS: UpgradeCard[] = [
  {
    id: "elite-training",
    type: UpgradeType.TRAINING,
    name: "Elite Training Program",
    description: "Advanced coaching and training",
    benefit: "+5 to all player stats",
    costUSDC: 100,
    isPermanent: true,
    statBonuses: {
      speed: 5,
      strength: 5,
      stamina: 5,
      accuracy: 5,
    },
  },

  {
    id: "premium-equipment",
    type: UpgradeType.EQUIPMENT,
    name: "Premium Equipment Pack",
    description: "Top-tier boots, kit, and gear",
    benefit: "+3 speed, +2 accuracy",
    costUSDC: 75,
    isPermanent: true,
    statBonuses: {
      speed: 3,
      accuracy: 2,
    },
  },

  {
    id: "modern-stadium",
    type: UpgradeType.FACILITY,
    name: "Modern Stadium",
    description: "State-of-the-art facilities",
    benefit: "+10% stamina regeneration",
    costUSDC: 200,
    isPermanent: true,
    statBonuses: {
      stamina: 10,
    },
  },

  {
    id: "medical-center",
    type: UpgradeType.MEDICAL,
    name: "Advanced Medical Center",
    description: "Injury prevention and recovery",
    benefit: "Faster stamina regen, fewer injuries",
    costUSDC: 150,
    isPermanent: true,
    statBonuses: {
      stamina: 8,
    },
  },
];

/**
 * Track team upgrades
 */
export class UpgradeManager {
  private teamUpgrades: Map<string, Set<string>> = new Map(); // teamId -> upgradeIds

  hasUpgrade(teamId: string, upgradeId: string): boolean {
    return this.teamUpgrades.get(teamId)?.has(upgradeId) ?? false;
  }

  applyUpgrade(teamId: string, upgradeId: string): void {
    if (!this.teamUpgrades.has(teamId)) {
      this.teamUpgrades.set(teamId, new Set());
    }
    this.teamUpgrades.get(teamId)!.add(upgradeId);
  }

  getTeamBonuses(teamId: string): {
    speed: number;
    strength: number;
    stamina: number;
    accuracy: number;
  } {
    const upgrades = this.teamUpgrades.get(teamId) || new Set();
    const bonuses = { speed: 0, strength: 0, stamina: 0, accuracy: 0 };

    for (const upgradeId of upgrades) {
      const upgrade = UPGRADE_CARDS.find((u) => u.id === upgradeId);
      if (upgrade) {
        bonuses.speed += upgrade.statBonuses.speed ?? 0;
        bonuses.strength += upgrade.statBonuses.strength ?? 0;
        bonuses.stamina += upgrade.statBonuses.stamina ?? 0;
        bonuses.accuracy += upgrade.statBonuses.accuracy ?? 0;
      }
    }

    return bonuses;
  }
}
```

---

## Part 6: Card Crafting & Upgrades

```typescript
// services/card-crafting-service.ts
export class CardCraftingService {
  /**
   * Combine 3 cards of same type to create rarer version
   * 3x Common → 1x Uncommon
   * 3x Uncommon → 1x Rare
   * etc.
   */
  async craftCard(
    player: string,
    cardId: string,
    quantity: number
  ): Promise<{ newCardId: string; newRarity: Rarity }> {
    // Check player has 3 copies
    const balance = await this.cardContract.balanceOf(player, cardId);
    if (balance < 3) {
      throw new Error("Need 3 copies to craft");
    }

    const card = await this.cardContract.getCardData(cardId);
    const newRarity = this.getUpgradedRarity(card.rarity);

    // Burn 3 old cards
    await this.cardContract.burnCard(player, cardId, 3);

    // Mint 1 upgraded card
    const newCardId = await this.findUpgradedCard(cardId, newRarity);
    await this.cardContract.mintCard(player, newCardId, 1);

    return { newCardId, newRarity };
  }

  private getUpgradedRarity(current: Rarity): Rarity {
    if (current === Rarity.COMMON) return Rarity.UNCOMMON;
    if (current === Rarity.UNCOMMON) return Rarity.RARE;
    if (current === Rarity.RARE) return Rarity.EPIC;
    if (current === Rarity.EPIC) return Rarity.LEGENDARY;
    return Rarity.LEGENDARY;
  }

  private async findUpgradedCard(
    baseCardId: string,
    newRarity: Rarity
  ): Promise<string> {
    // Find corresponding card at new rarity
    const baseCard = await this.cardContract.getCardData(baseCardId);
    // Logic to find upgraded version
    return baseCardId; // Simplified
  }

  /**
   * Sell card on marketplace
   */
  async listCard(
    cardId: string,
    amount: number,
    priceUSDC: number
  ): Promise<void> {
    // Store listing in database
    // List on secondary marketplace
  }

  /**
   * Buy card from marketplace
   */
  async buyCard(
    cardId: string,
    amount: number,
    seller: string
  ): Promise<void> {
    // Verify listing exists
    // Transfer USDC from buyer to seller
    // Transfer card from seller to buyer
  }
}
```

---

## Part 7: Testing

```solidity
// test/BassBallPlayerCard.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {BassBallPlayerCard} from "../src/BassBallPlayerCard.sol";

contract BassBallPlayerCardTest is Test {
  BassBallPlayerCard card;
  address admin = address(0x1);
  address player1 = address(0x2);
  address player2 = address(0x3);

  function setUp() public {
    vm.prank(admin);
    card = new BassBallPlayerCard("ipfs://base-uri/");
  }

  function testCreateFootballerCard() public {
    vm.prank(admin);
    uint256 cardId = card.createFootballerCard(
      "Speedster",
      "Fast winger",
      "QmCard1",
      95,  // speed
      60,  // strength
      75,  // accuracy
      80,  // stamina
      85,  // dribbling
      50,  // ratingBoost
      BassBallPlayerCard.Rarity.UNCOMMON,
      1000 // maxSupply
    );

    assertEq(cardId, 1);

    BassBallPlayerCard.CardData memory data = card.getCardData(cardId);
    assertEq(data.name, "Speedster");
    assertEq(
      uint(data.cardType),
      uint(BassBallPlayerCard.CardType.FOOTBALLER)
    );
  }

  function testMintCard() public {
    vm.prank(admin);
    uint256 cardId = card.createFootballerCard(
      "Striker",
      "Goal scorer",
      "QmCard2",
      80,
      80,
      95,
      80,
      80,
      100,
      BassBallPlayerCard.Rarity.RARE,
      500
    );

    vm.prank(admin);
    card.mintCard(player1, cardId, 3);

    assertEq(card.balanceOf(player1, cardId), 3);
  }

  function testBurnCard() public {
    vm.prank(admin);
    uint256 cardId = card.createFootballerCard(
      "Midfielder",
      "Playmaker",
      "QmCard3",
      75,
      75,
      85,
      90,
      85,
      75,
      BassBallPlayerCard.Rarity.COMMON,
      1000
    );

    vm.prank(admin);
    card.mintCard(player1, cardId, 5);

    vm.prank(player1);
    card.burnCard(player1, cardId, 2);

    assertEq(card.balanceOf(player1, cardId), 3);
  }

  function testBatchMint() public {
    vm.prank(admin);
    uint256 card1 = card.createFootballerCard(
      "Card1",
      "Desc1",
      "QmCard1",
      80,
      80,
      80,
      80,
      80,
      50,
      BassBallPlayerCard.Rarity.COMMON,
      1000
    );

    vm.prank(admin);
    uint256 card2 = card.createFootballerCard(
      "Card2",
      "Desc2",
      "QmCard2",
      85,
      85,
      85,
      85,
      85,
      50,
      BassBallPlayerCard.Rarity.UNCOMMON,
      500
    );

    uint256[] memory ids = new uint256[](2);
    ids[0] = card1;
    ids[1] = card2;

    uint256[] memory amounts = new uint256[](2);
    amounts[0] = 2;
    amounts[1] = 3;

    vm.prank(admin);
    card.mintBatch(player1, ids, amounts);

    assertEq(card.balanceOf(player1, card1), 2);
    assertEq(card.balanceOf(player1, card2), 3);
  }

  function testMaxSupplyEnforced() public {
    vm.prank(admin);
    uint256 cardId = card.createFootballerCard(
      "Limited",
      "Rare",
      "QmCard",
      80,
      80,
      80,
      80,
      80,
      50,
      BassBallPlayerCard.Rarity.RARE,
      100 // Only 100 copies
    );

    vm.prank(admin);
    vm.expectRevert("Exceeds max supply");
    card.mintCard(player1, cardId, 101);
  }

  function testGetRarityMultiplier() public {
    vm.prank(admin);
    uint256 legendary = card.createFootballerCard(
      "Legend",
      "Legendary",
      "QmCard",
      90,
      90,
      90,
      90,
      90,
      200,
      BassBallPlayerCard.Rarity.LEGENDARY,
      10
    );

    uint8 multiplier = card.getStatMultiplier(legendary);
    assertEq(multiplier, 160); // 1.6x
  }

  function testTransfers() public {
    vm.prank(admin);
    uint256 cardId = card.createFootballerCard(
      "Transferable",
      "Card",
      "QmCard",
      80,
      80,
      80,
      80,
      80,
      50,
      BassBallPlayerCard.Rarity.UNCOMMON,
      1000
    );

    vm.prank(admin);
    card.mintCard(player1, cardId, 5);

    vm.prank(player1);
    card.safeTransferFrom(player1, player2, cardId, 2, "");

    assertEq(card.balanceOf(player1, cardId), 3);
    assertEq(card.balanceOf(player2, cardId), 2);
  }
}
```

---

## Summary

### ERC-1155 Advantages
- **Batch operations**: Transfer multiple card types in 1 transaction
- **Efficiency**: Single contract for all card types
- **Scalability**: No limit on card variety
- **Gas savings**: ~40% cheaper than separate ERC721s

### Card Types
- **Footballers** (Common → Legendary): Stat boosts, rarity-based multipliers
- **Consumables**: Single-use items (stamina, speed, protection)
- **Upgrades**: Permanent team improvements (training, equipment, facilities)

### Rarity Distribution
- Common: 65%
- Uncommon: 25%
- Rare: 8%
- Epic: 1.5%
- Legendary: 0.5%

### Key Features
- Max supply enforcement per card
- Dynamic stat multipliers (1.0x → 1.6x)
- Crafting system (3x card → 1x rarer)
- Batch minting/burning
- Full ERC1155 marketplace support
- On-chain metadata with stats
