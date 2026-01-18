// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title BassballPlayerNFT
 * @notice ERC721 NFT contract for player badges and achievements on Base network
 */
contract BassballPlayerNFT is ERC721, ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIdCounter;

  // Badge types
  enum BadgeType {
    OG_PLAYER,
    CHAMPION,
    TOP_1_PERCENT,
    LIVING_LEGEND,
    STREAK_MASTER,
    BADGE_COLLECTOR
  }

  // Badge metadata
  struct Badge {
    BadgeType badgeType;
    string name;
    string description;
    uint256 maxSupply;
    uint256 currentSupply;
  }

  // Token metadata
  struct TokenMetadata {
    address owner;
    BadgeType badgeType;
    uint256 mintedAt;
    uint256 rating;
  }

  mapping(BadgeType => Badge) public badges;
  mapping(uint256 => TokenMetadata) public tokenMetadata;
  mapping(address => uint256[]) public playerTokens;

  event BadgeMinted(address indexed to, uint256 indexed tokenId, BadgeType badgeType);
  event BadgeBurned(address indexed from, uint256 indexed tokenId);

  constructor() ERC721("Bassball Player Badge", "BBPG") {
    // Initialize badge types
    badges[BadgeType.OG_PLAYER] = Badge(
      BadgeType.OG_PLAYER,
      "OG Player",
      "First-mover advantage badge",
      0, // Unlimited
      0
    );

    badges[BadgeType.CHAMPION] = Badge(
      BadgeType.CHAMPION,
      "Champion",
      "For champions with 60% win rate",
      0, // Unlimited
      0
    );

    badges[BadgeType.TOP_1_PERCENT] = Badge(
      BadgeType.TOP_1_PERCENT,
      "Top 1%",
      "Elite player in top 1% percentile",
      100,
      0
    );

    badges[BadgeType.LIVING_LEGEND] = Badge(
      BadgeType.LIVING_LEGEND,
      "Living Legend",
      "Ultimate achievement - 70% win rate, 500+ matches",
      10,
      0
    );

    badges[BadgeType.STREAK_MASTER] = Badge(
      BadgeType.STREAK_MASTER,
      "Streak Master",
      "20+ consecutive wins",
      0, // Unlimited
      0
    );

    badges[BadgeType.BADGE_COLLECTOR] = Badge(
      BadgeType.BADGE_COLLECTOR,
      "Badge Collector",
      "5+ different badges earned",
      0, // Unlimited
      0
    );
  }

  /**
   * @notice Mint a new badge to a player
   * @param to Address to mint badge to
   * @param badgeType Type of badge to mint
   * @param uri Token URI for metadata
   * @param playerRating Current player rating
   */
  function mintBadge(
    address to,
    BadgeType badgeType,
    string memory uri,
    uint256 playerRating
  ) public onlyOwner returns (uint256) {
    Badge storage badge = badges[badgeType];

    // Check max supply limit
    if (badge.maxSupply > 0) {
      require(badge.currentSupply < badge.maxSupply, "Max supply reached");
    }

    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();

    // Mint token
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);

    // Store metadata
    tokenMetadata[tokenId] = TokenMetadata(to, badgeType, block.timestamp, playerRating);

    // Track player tokens
    playerTokens[to].push(tokenId);

    // Update badge supply
    badge.currentSupply++;

    emit BadgeMinted(to, tokenId, badgeType);

    return tokenId;
  }

  /**
   * @notice Burn a badge (remove it from player)
   * @param tokenId Token ID to burn
   */
  function burnBadge(uint256 tokenId) public {
    require(ownerOf(tokenId) == msg.sender, "Not token owner");
    Badge storage badge = badges[tokenMetadata[tokenId].badgeType];
    badge.currentSupply--;
    _burn(tokenId);
    emit BadgeBurned(msg.sender, tokenId);
  }

  /**
   * @notice Get all badges for a player
   * @param player Player address
   */
  function getPlayerBadges(address player) public view returns (uint256[] memory) {
    return playerTokens[player];
  }

  /**
   * @notice Get badge details
   * @param badgeType Type of badge
   */
  function getBadgeDetails(BadgeType badgeType) public view returns (Badge memory) {
    return badges[badgeType];
  }

  /**
   * @notice Get total badge count for a player
   * @param player Player address
   */
  function getBadgeCount(address player) public view returns (uint256) {
    return playerTokens[player].length;
  }

  // Override required functions for ERC721URIStorage
  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
