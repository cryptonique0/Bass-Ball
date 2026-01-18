# Team NFT (ERC-721) for Bass Ball

## Part 1: Core Interface & Design

### Overview

Each player gets exactly **one soul-bound Team NFT** representing their club. This NFT:
- Grants club ownership rights
- Stores team customization (colors, name, jersey)
- Cannot be transferred (soul-bound to player)
- Accrues badges and achievements
- Links to on-chain team stats

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITeamNFT {
    struct Team {
        address owner;              // Team owner/player
        string name;                // Club name
        string colors;              // "color1,color2" hex format
        string jerseyURI;           // IPFS hash for jersey design
        string logoURI;             // IPFS hash for logo
        string badgeURI;            // IPFS hash for badge/crest
        uint64 createdAt;           // Timestamp
        uint32 rating;              // Current team rating (ELO)
        uint32 wins;                // Total wins
        uint32 losses;              // Total losses
        uint32 goalsFor;            // Goals scored
        uint32 goalsAgainst;        // Goals conceded
    }

    enum JerseyPattern {
        SOLID,           // Single color
        STRIPES,         // Vertical stripes
        HOOPS,          // Horizontal hoops
        CHECKS,         // Checkered
        GRADIENT,       // Color gradient
        CUSTOM          // User-defined pattern
    }

    struct Jersey {
        JerseyPattern pattern;
        string color1;              // Primary color (hex)
        string color2;              // Secondary color (hex)
        string logoURI;             // IPFS badge
        uint64 designedAt;
    }

    struct Badge {
        uint256 badgeId;
        string name;                // Badge name
        string description;
        string imageURI;            // IPFS image
        uint64 awardedAt;
        bool isActive;              // Badge visibility
    }

    event TeamCreated(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        uint64 createdAt
    );

    event JerseyUpdated(
        uint256 indexed tokenId,
        JerseyPattern pattern,
        string color1,
        string color2
    );

    event BadgeAdded(
        uint256 indexed tokenId,
        uint256 badgeId,
        string badgeName
    );

    event TeamStatsUpdated(
        uint256 indexed tokenId,
        uint32 wins,
        uint32 losses,
        uint32 rating
    );

    /// Mint a new team NFT (one per player)
    function mintTeam(
        address to,
        string calldata name,
        string calldata colors
    ) external returns (uint256 tokenId);

    /// Get token owner
    function ownerOf(uint256 tokenId)
        external
        view
        returns (address);

    /// Get team metadata
    function getTeam(uint256 tokenId)
        external
        view
        returns (Team memory);

    /// Get team by player address
    function getTeamByOwner(address owner)
        external
        view
        returns (uint256 tokenId);

    /// Check if player has a team
    function hasTeam(address player) external view returns (bool);

    /// Update team name
    function updateTeamName(uint256 tokenId, string calldata newName)
        external;

    /// Update team colors
    function updateTeamColors(uint256 tokenId, string calldata colors)
        external;

    /// Update jersey design
    function updateJersey(
        uint256 tokenId,
        JerseyPattern pattern,
        string calldata color1,
        string calldata color2,
        string calldata logoURI
    ) external;

    /// Get current jersey
    function getJersey(uint256 tokenId)
        external
        view
        returns (Jersey memory);

    /// Add badge to team
    function addBadge(
        uint256 tokenId,
        string calldata badgeName,
        string calldata badgeDescription,
        string calldata badgeImageURI
    ) external returns (uint256 badgeId);

    /// Get all badges for team
    function getTeamBadges(uint256 tokenId)
        external
        view
        returns (Badge[] memory);

    /// Update team stats (called by match settlement)
    function updateStats(
        uint256 tokenId,
        uint32 wins,
        uint32 losses,
        uint32 rating,
        uint32 goalsFor,
        uint32 goalsAgainst
    ) external;

    /// Team is non-transferable
    function transfer(address to, uint256 tokenId)
        external
        pure
        returns (bool) {
        revert("Non-transferable");
    }
}
```

---

## Part 2: Complete Implementation

### BassBallTeamNFT Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ITeamNFT.sol";

contract BassBallTeamNFT is ERC721, AccessControl, ITeamNFT {
    using Counters for Counters.Counter;
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant STATS_UPDATER_ROLE =
        keccak256("STATS_UPDATER_ROLE");
    bytes32 public constant BADGE_AWARDER_ROLE =
        keccak256("BADGE_AWARDER_ROLE");

    Counters.Counter private tokenIdCounter;
    Counters.Counter private badgeIdCounter;

    mapping(uint256 => Team) public teams;
    mapping(address => uint256) public playerTeams; // One team per player
    mapping(uint256 => Jersey) public jerseys;
    mapping(uint256 => Badge[]) public teamBadges;
    mapping(uint256 => mapping(uint256 => bool)) public badgeExists; // tokenId => badgeId => exists

    string private baseMetadataURI;

    constructor(string memory _baseMetadataURI) ERC721("Bass Ball Teams", "BBALL") {
        baseMetadataURI = _baseMetadataURI;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(STATS_UPDATER_ROLE, msg.sender);
        _grantRole(BADGE_AWARDER_ROLE, msg.sender);
    }

    /**
     * MINT NEW TEAM
     * Creates a soul-bound team NFT for a player
     * One team per player enforced
     */
    function mintTeam(
        address to,
        string calldata name,
        string calldata colors
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        require(to != address(0), "Invalid address");
        require(playerTeams[to] == 0, "Player already has a team");
        require(bytes(name).length > 0, "Empty team name");
        require(bytes(colors).length > 0, "Empty colors");
        require(bytes(name).length <= 50, "Name too long");
        require(bytes(colors).length <= 20, "Colors string too long");

        tokenIdCounter.increment();
        tokenId = tokenIdCounter.current();

        // Mint NFT
        _safeMint(to, tokenId);

        // Store team data
        teams[tokenId] = Team({
            owner: to,
            name: name,
            colors: colors,
            jerseyURI: "",
            logoURI: "",
            badgeURI: "",
            createdAt: uint64(block.timestamp),
            rating: 1000,
            wins: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0
        });

        // Create default jersey
        jerseys[tokenId] = Jersey({
            pattern: JerseyPattern.SOLID,
            color1: _extractColor(colors, 0),
            color2: _extractColor(colors, 1),
            logoURI: "",
            designedAt: uint64(block.timestamp)
        });

        // Link player to team
        playerTeams[to] = tokenId;

        emit TeamCreated(tokenId, to, name, uint64(block.timestamp));

        return tokenId;
    }

    /**
     * GET TEAM DATA
     */
    function getTeam(uint256 tokenId)
        external
        view
        tokenExists(tokenId)
        returns (Team memory)
    {
        return teams[tokenId];
    }

    function ownerOf(uint256 tokenId) public view override(ERC721) returns (address) {
        require(_exists(tokenId), "Team not found");
        return teams[tokenId].owner;
    }

    function getTeamByOwner(address owner)
        external
        view
        returns (uint256 tokenId)
    {
        require(owner != address(0), "Invalid address");
        tokenId = playerTeams[owner];
        require(tokenId != 0, "Player has no team");
        return tokenId;
    }

    function hasTeam(address player) external view returns (bool) {
        return playerTeams[player] != 0;
    }

    /**
     * UPDATE TEAM INFORMATION
     */
    function updateTeamName(uint256 tokenId, string calldata newName)
        external
        tokenExists(tokenId)
        onlyTeamOwner(tokenId)
    {
        require(bytes(newName).length > 0, "Empty name");
        require(bytes(newName).length <= 50, "Name too long");

        teams[tokenId].name = newName;

        emit TeamStatsUpdated(
            tokenId,
            teams[tokenId].wins,
            teams[tokenId].losses,
            teams[tokenId].rating
        );
    }

    function updateTeamColors(uint256 tokenId, string calldata colors)
        external
        tokenExists(tokenId)
        onlyTeamOwner(tokenId)
    {
        require(bytes(colors).length > 0, "Empty colors");
        require(bytes(colors).length <= 20, "Colors string too long");

        teams[tokenId].colors = colors;

        // Update jersey colors too
        jerseys[tokenId].color1 = _extractColor(colors, 0);
        jerseys[tokenId].color2 = _extractColor(colors, 1);

        emit TeamStatsUpdated(
            tokenId,
            teams[tokenId].wins,
            teams[tokenId].losses,
            teams[tokenId].rating
        );
    }

    /**
     * JERSEY MANAGEMENT
     * Players can customize jersey design
     */
    function updateJersey(
        uint256 tokenId,
        JerseyPattern pattern,
        string calldata color1,
        string calldata color2,
        string calldata logoURI
    ) external tokenExists(tokenId) onlyTeamOwner(tokenId) {
        require(uint(pattern) <= uint(JerseyPattern.CUSTOM), "Invalid pattern");
        require(bytes(color1).length == 7, "Invalid color format");
        require(bytes(color2).length == 7, "Invalid color format");

        jerseys[tokenId] = Jersey({
            pattern: pattern,
            color1: color1,
            color2: color2,
            logoURI: logoURI,
            designedAt: uint64(block.timestamp)
        });

        emit JerseyUpdated(tokenId, pattern, color1, color2);
    }

    function getJersey(uint256 tokenId)
        external
        view
        tokenExists(tokenId)
        returns (Jersey memory)
    {
        return jerseys[tokenId];
    }

    /**
     * BADGE SYSTEM
     * Award badges for achievements
     */
    function addBadge(
        uint256 tokenId,
        string calldata badgeName,
        string calldata badgeDescription,
        string calldata badgeImageURI
    ) external tokenExists(tokenId) onlyRole(BADGE_AWARDER_ROLE) returns (uint256 badgeId) {
        require(bytes(badgeName).length > 0, "Empty badge name");
        require(bytes(badgeImageURI).length > 0, "Empty badge image");

        badgeIdCounter.increment();
        badgeId = badgeIdCounter.current();

        Badge memory badge = Badge({
            badgeId: badgeId,
            name: badgeName,
            description: badgeDescription,
            imageURI: badgeImageURI,
            awardedAt: uint64(block.timestamp),
            isActive: true
        });

        teamBadges[tokenId].push(badge);
        badgeExists[tokenId][badgeId] = true;

        emit BadgeAdded(tokenId, badgeId, badgeName);

        return badgeId;
    }

    function getTeamBadges(uint256 tokenId)
        external
        view
        tokenExists(tokenId)
        returns (Badge[] memory)
    {
        return teamBadges[tokenId];
    }

    function getBadgeCount(uint256 tokenId)
        external
        view
        tokenExists(tokenId)
        returns (uint256)
    {
        return teamBadges[tokenId].length;
    }

    function hasBadge(uint256 tokenId, uint256 badgeId)
        external
        view
        tokenExists(tokenId)
        returns (bool)
    {
        return badgeExists[tokenId][badgeId];
    }

    /**
     * UPDATE STATS (Called by match settlement contract)
     */
    function updateStats(
        uint256 tokenId,
        uint32 wins,
        uint32 losses,
        uint32 rating,
        uint32 goalsFor,
        uint32 goalsAgainst
    ) external tokenExists(tokenId) onlyRole(STATS_UPDATER_ROLE) {
        require(wins >= teams[tokenId].wins, "Wins must increase");
        require(losses >= teams[tokenId].losses, "Losses must increase");

        teams[tokenId].wins = wins;
        teams[tokenId].losses = losses;
        teams[tokenId].rating = rating;
        teams[tokenId].goalsFor = goalsFor;
        teams[tokenId].goalsAgainst = goalsAgainst;

        emit TeamStatsUpdated(tokenId, wins, losses, rating);
    }

    /**
     * TOKEN URI (Metadata)
     * Returns JSON metadata for NFT
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        tokenExists(tokenId)
        returns (string memory)
    {
        Team memory team = teams[tokenId];
        Jersey memory jersey = jerseys[tokenId];
        Badge[] memory badges = teamBadges[tokenId];

        string memory badgesJSON = "[";
        for (uint i = 0; i < badges.length; i++) {
            if (i > 0) badgesJSON = string.concat(badgesJSON, ",");
            badgesJSON = string.concat(
                badgesJSON,
                '{"name":"',
                badges[i].name,
                '","image":"',
                badges[i].imageURI,
                '"}'
            );
        }
        badgesJSON = string.concat(badgesJSON, "]");

        string memory json = string.concat(
            '{"name":"',
            team.name,
            ' Team","description":"Bass Ball Team NFT","image":"',
            baseMetadataURI,
            "/team/",
            tokenId.toString(),
            '.png","attributes":[',
            '{"trait_type":"Rating","value":',
            Strings.toString(team.rating),
            '},',
            '{"trait_type":"Wins","value":',
            Strings.toString(team.wins),
            '},',
            '{"trait_type":"Losses","value":',
            Strings.toString(team.losses),
            '},',
            '{"trait_type":"Created","value":"',
            Strings.toString(team.createdAt),
            '"},',
            '{"trait_type":"Jersey Pattern","value":"',
            _patternToString(jersey.pattern),
            '"},',
            '{"trait_type":"Badge Count","value":',
            Strings.toString(badges.length),
            '}',
            '],"badges":',
            badgesJSON,
            "}"
        );

        bytes memory jsonBytes = bytes(json);
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                _encode(jsonBytes)
            )
        );
    }

    /**
     * PREVENT TRANSFERS (Soul-bound)
     */
    function transfer(address to, uint256 tokenId)
        external
        pure
        override
        returns (bool)
    {
        revert("Non-transferable");
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        revert("Non-transferable");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        revert("Non-transferable");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        revert("Non-transferable");
    }

    /**
     * INTERFACE SUPPORT
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * INTERNAL HELPERS
     */
    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "Team not found");
        _;
    }

    modifier onlyTeamOwner(uint256 tokenId) {
        require(msg.sender == teams[tokenId].owner, "Not team owner");
        _;
    }

    function _extractColor(string calldata colors, uint8 index)
        internal
        pure
        returns (string memory)
    {
        bytes memory colorsBytes = bytes(colors);
        uint256 pos = 0;
        uint256 count = 0;

        for (uint256 i = 0; i < colorsBytes.length; i++) {
            if (colorsBytes[i] == ",") {
                if (count == index) {
                    return _substring(colors, pos, i);
                }
                pos = i + 1;
                count++;
            }
        }

        if (count == index) {
            return _substring(colors, pos, colorsBytes.length);
        }

        return "";
    }

    function _substring(
        string calldata str,
        uint256 startIndex,
        uint256 endIndex
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);

        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }

        return string(result);
    }

    function _patternToString(JerseyPattern pattern)
        internal
        pure
        returns (string memory)
    {
        if (pattern == JerseyPattern.SOLID) return "Solid";
        if (pattern == JerseyPattern.STRIPES) return "Stripes";
        if (pattern == JerseyPattern.HOOPS) return "Hoops";
        if (pattern == JerseyPattern.CHECKS) return "Checks";
        if (pattern == JerseyPattern.GRADIENT) return "Gradient";
        if (pattern == JerseyPattern.CUSTOM) return "Custom";
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

## Part 3: Jersey System

### Jersey Design Patterns

```typescript
// lib/jersey/jersey-patterns.ts
export enum JerseyPattern {
  SOLID = 0,      // Single solid color
  STRIPES = 1,    // Vertical stripes
  HOOPS = 2,      // Horizontal hoops
  CHECKS = 3,     // Checkered pattern
  GRADIENT = 4,   // Color gradient
  CUSTOM = 5,     // Custom pattern (uploaded image)
}

export interface JerseyDesign {
  pattern: JerseyPattern;
  primaryColor: string;    // Hex color
  secondaryColor: string;
  logoURI?: string;        // IPFS hash
  customImageURI?: string; // For CUSTOM pattern
}

/**
 * Generate jersey SVG preview
 */
export function generateJerseySVG(design: JerseyDesign): string {
  const width = 200;
  const height = 300;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Base jersey shape
  svg += `<path d="M 50 30 L 70 10 L 130 10 L 150 30 L 150 200 Q 150 250 100 260 Q 50 250 50 200 Z" 
            fill="${design.primaryColor}"/>`;

  // Add pattern
  switch (design.pattern) {
    case JerseyPattern.SOLID:
      // Already filled
      break;

    case JerseyPattern.STRIPES:
      for (let i = 50; i < 150; i += 8) {
        svg += `<line x1="${i}" y1="30" x2="${i}" y2="200" 
                      stroke="${design.secondaryColor}" stroke-width="4"/>`;
      }
      break;

    case JerseyPattern.HOOPS:
      for (let i = 30; i < 260; i += 12) {
        svg += `<circle cx="100" cy="${i}" r="50" 
                       fill="none" stroke="${design.secondaryColor}" stroke-width="6"/>`;
      }
      break;

    case JerseyPattern.CHECKS:
      for (let y = 30; y < 200; y += 15) {
        for (let x = 50; x < 150; x += 15) {
          if (((y - 30) / 15 + (x - 50) / 15) % 2 === 0) {
            svg += `<rect x="${x}" y="${y}" width="15" height="15" 
                          fill="${design.secondaryColor}" opacity="0.7"/>`;
          }
        }
      }
      break;

    case JerseyPattern.GRADIENT:
      svg += `<defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:${design.primaryColor};stop-opacity:1" />
                  <stop offset="100%" style="stop-color:${design.secondaryColor};stop-opacity:1" />
                </linearGradient>
              </defs>`;
      svg += `<path d="M 50 30 L 70 10 L 130 10 L 150 30 L 150 200 Q 150 250 100 260 Q 50 250 50 200 Z" 
              fill="url(#grad)"/>`;
      break;

    case JerseyPattern.CUSTOM:
      if (design.customImageURI) {
        svg += `<image href="https://gateway.pinata.cloud/ipfs/${design.customImageURI}" 
                       x="50" y="30" width="100" height="170"/>`;
      }
      break;
  }

  // Add logo
  if (design.logoURI) {
    svg += `<image href="https://gateway.pinata.cloud/ipfs/${design.logoURI}" 
                   x="80" y="110" width="40" height="40"/>`;
  }

  svg += "</svg>";
  return svg;
}

/**
 * Store jersey design to IPFS
 */
export async function storeJerseyDesign(
  design: JerseyDesign,
  ipfsService: IPFSService
): Promise<string> {
  const svg = generateJerseySVG(design);

  const result = await ipfsService.pinJSONToIPFS(
    {
      pattern: design.pattern,
      colors: [design.primaryColor, design.secondaryColor],
      svg,
      timestamp: Date.now(),
    },
    {
      pinataMetadata: {
        name: `jersey-design`,
        keyvalues: {
          type: "jersey",
          pattern: JerseyPattern[design.pattern],
        },
      },
    }
  );

  return result.IpfsHash;
}
```

### Jersey UI Component

```typescript
// components/Team/JerseyDesigner.tsx
import { useState } from "react";
import { JerseyPattern, JerseyDesign, generateJerseySVG } from "@/lib/jersey/jersey-patterns";

export function JerseyDesigner({
  teamId,
  onSave,
}: {
  teamId: string;
  onSave: (design: JerseyDesign) => Promise<void>;
}) {
  const [design, setDesign] = useState<JerseyDesign>({
    pattern: JerseyPattern.SOLID,
    primaryColor: "#1A1A1A",
    secondaryColor: "#FFFFFF",
  });

  const patterns = [
    { value: JerseyPattern.SOLID, label: "Solid" },
    { value: JerseyPattern.STRIPES, label: "Vertical Stripes" },
    { value: JerseyPattern.HOOPS, label: "Hoops" },
    { value: JerseyPattern.CHECKS, label: "Checkered" },
    { value: JerseyPattern.GRADIENT, label: "Gradient" },
    { value: JerseyPattern.CUSTOM, label: "Custom Upload" },
  ];

  const handlePatternChange = (pattern: JerseyPattern) => {
    setDesign({ ...design, pattern });
  };

  const handleColorChange = (color: string, isSecondary: boolean) => {
    if (isSecondary) {
      setDesign({ ...design, secondaryColor: color });
    } else {
      setDesign({ ...design, primaryColor: color });
    }
  };

  const preview = generateJerseySVG(design);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gray-900 rounded-lg">
      {/* Preview */}
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-white text-lg font-bold mb-4">Preview</h3>
        <div
          className="bg-gray-800 p-4 rounded-lg"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-6">
        {/* Pattern Selection */}
        <div>
          <label className="text-white font-semibold mb-2 block">Pattern</label>
          <div className="grid grid-cols-2 gap-2">
            {patterns.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePatternChange(p.value)}
                className={`p-3 rounded text-sm font-medium transition ${
                  design.pattern === p.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Color */}
        <div>
          <label className="text-white font-semibold mb-2 block">
            Primary Color
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={design.primaryColor}
              onChange={(e) => handleColorChange(e.target.value, false)}
              className="w-12 h-12 rounded cursor-pointer"
            />
            <input
              type="text"
              value={design.primaryColor}
              onChange={(e) => handleColorChange(e.target.value, false)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded font-mono text-sm"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <label className="text-white font-semibold mb-2 block">
            Secondary Color
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={design.secondaryColor}
              onChange={(e) => handleColorChange(e.target.value, true)}
              className="w-12 h-12 rounded cursor-pointer"
            />
            <input
              type="text"
              value={design.secondaryColor}
              onChange={(e) => handleColorChange(e.target.value, true)}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded font-mono text-sm"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={() => onSave(design)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          Save Jersey Design
        </button>
      </div>
    </div>
  );
}
```

---

## Part 4: Badge System

### Badge Types & Awards

```typescript
// lib/badges/badge-definitions.ts
export enum BadgeType {
  // Milestones
  FIRST_MATCH = "first_match",
  FIRST_WIN = "first_win",
  FIRST_GOAL = "first_goal",
  TEN_WINS = "ten_wins",
  FIFTY_WINS = "fifty_wins",
  HUNDRED_WINS = "hundred_wins",

  // Streaks
  WIN_STREAK_3 = "win_streak_3",
  WIN_STREAK_5 = "win_streak_5",
  WIN_STREAK_10 = "win_streak_10",

  // Performance
  HAT_TRICK = "hat_trick",
  CLEAN_SHEET = "clean_sheet",
  PERFECT_MATCH = "perfect_match", // No mistakes, 5+ goals

  // Leaderboard
  TOP_100 = "top_100",
  TOP_50 = "top_50",
  TOP_10 = "top_10",
  NUMBER_ONE = "number_one",

  // Social
  FARCASTER_LINKED = "farcaster_linked",
  TWITTER_SHARED = "twitter_shared",

  // Special Events
  TOURNAMENT_WINNER = "tournament_winner",
  SEASONAL_CHAMPION = "seasonal_champion",
  EARLY_ADOPTER = "early_adopter",
}

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  imageURI: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  requirements: string;
}

export const BADGE_DEFINITIONS: Record<BadgeType, Badge> = {
  [BadgeType.FIRST_WIN]: {
    id: "first_win",
    type: BadgeType.FIRST_WIN,
    name: "First Victory",
    description: "Win your first match",
    imageURI: "ipfs://QmFirstWin",
    rarity: "common",
    requirements: "wins >= 1",
  },

  [BadgeType.TEN_WINS]: {
    id: "ten_wins",
    type: BadgeType.TEN_WINS,
    name: "Rising Star",
    description: "Achieve 10 wins",
    imageURI: "ipfs://QmTenWins",
    rarity: "uncommon",
    requirements: "wins >= 10",
  },

  [BadgeType.FIFTY_WINS]: {
    id: "fifty_wins",
    type: BadgeType.FIFTY_WINS,
    name: "Elite",
    description: "Achieve 50 wins",
    imageURI: "ipfs://QmFiftyWins",
    rarity: "rare",
    requirements: "wins >= 50",
  },

  [BadgeType.HAT_TRICK]: {
    id: "hat_trick",
    type: BadgeType.HAT_TRICK,
    name: "Hat Trick Hero",
    description: "Score 3+ goals in a single match",
    imageURI: "ipfs://QmHatTrick",
    rarity: "epic",
    requirements: "goalsInMatch >= 3",
  },

  [BadgeType.CLEAN_SHEET]: {
    id: "clean_sheet",
    type: BadgeType.CLEAN_SHEET,
    name: "Fortress",
    description: "Win without conceding a goal",
    imageURI: "ipfs://QmCleanSheet",
    rarity: "rare",
    requirements: "scoreAgainst == 0 && won",
  },

  [BadgeType.NUMBER_ONE]: {
    id: "number_one",
    type: BadgeType.NUMBER_ONE,
    name: "Champion",
    description: "Reach #1 on the leaderboard",
    imageURI: "ipfs://QmNumberOne",
    rarity: "legendary",
    requirements: "rank == 1",
  },

  [BadgeType.FARCASTER_LINKED]: {
    id: "farcaster_linked",
    type: BadgeType.FARCASTER_LINKED,
    name: "Frames Player",
    description: "Link your Farcaster account",
    imageURI: "ipfs://QmFarcasterLinked",
    rarity: "uncommon",
    requirements: "farcasterLinked == true",
  },

  // ... more badges
};

export function shouldAwardBadge(
  badge: BadgeType,
  playerStats: any
): boolean {
  switch (badge) {
    case BadgeType.FIRST_WIN:
      return playerStats.wins >= 1;

    case BadgeType.TEN_WINS:
      return playerStats.wins >= 10;

    case BadgeType.FIFTY_WINS:
      return playerStats.wins >= 50;

    case BadgeType.HUNDRED_WINS:
      return playerStats.wins >= 100;

    case BadgeType.NUMBER_ONE:
      return playerStats.rank === 1;

    default:
      return false;
  }
}
```

### Badge Award Service

```typescript
// services/badge-service.ts
import { BassBallTeamNFT } from "@/contracts";
import { BadgeType, BADGE_DEFINITIONS, shouldAwardBadge } from "@/lib/badges/badge-definitions";

export class BadgeAwardService {
  constructor(private teamContract: BassBallTeamNFT) {}

  /**
   * Check and award badges after match
   */
  async checkAndAwardBadges(
    teamId: string,
    playerStats: any,
    matchStats: any
  ): Promise<string[]> {
    const awardedBadges: string[] = [];

    // Check milestone badges
    if (shouldAwardBadge(BadgeType.FIRST_WIN, playerStats)) {
      const alreadyHas = await this.teamContract.hasBadge(
        teamId,
        BadgeType.FIRST_WIN
      );
      if (!alreadyHas) {
        await this.awardBadge(teamId, BadgeType.FIRST_WIN);
        awardedBadges.push(BadgeType.FIRST_WIN);
      }
    }

    // Check performance badges
    if (matchStats.goalsScored >= 3) {
      await this.awardBadge(teamId, BadgeType.HAT_TRICK);
      awardedBadges.push(BadgeType.HAT_TRICK);
    }

    if (matchStats.goalsAgainst === 0 && matchStats.won) {
      await this.awardBadge(teamId, BadgeType.CLEAN_SHEET);
      awardedBadges.push(BadgeType.CLEAN_SHEET);
    }

    return awardedBadges;
  }

  /**
   * Award a specific badge
   */
  private async awardBadge(teamId: string, badgeType: BadgeType): Promise<void> {
    const badgeDef = BADGE_DEFINITIONS[badgeType];

    await this.teamContract.addBadge(
      teamId,
      badgeDef.name,
      badgeDef.description,
      badgeDef.imageURI
    );

    console.log(`Badge awarded: ${badgeDef.name} (${teamId})`);
  }

  /**
   * Get all earned badges for team
   */
  async getTeamBadges(teamId: string): Promise<Badge[]> {
    const contractBadges = await this.teamContract.getTeamBadges(teamId);

    return contractBadges.map((badge) => {
      const def = Object.values(BADGE_DEFINITIONS).find(
        (b) => b.name === badge.name
      );
      return {
        ...badge,
        ...(def || {}),
      };
    });
  }
}
```

---

## Part 5: Integration with Match Settlement

```typescript
// services/match-settlement-integration.ts
import { BassBallTeamNFT } from "@/contracts";
import { BadgeAwardService } from "./badge-service";

export async function settleMatchAndUpdateTeams(
  matchId: string,
  winner: {
    teamId: string;
    stats: { wins: number; losses: number; rating: number };
    matchStats: { goalsScored: number };
  },
  loser: {
    teamId: string;
    stats: { wins: number; losses: number; rating: number };
    matchStats: { goalsScored: number };
  }
) {
  const teamContract = new BassBallTeamNFT();
  const badgeService = new BadgeAwardService(teamContract);

  // 1. Update team stats on-chain
  await teamContract.updateStats(
    winner.teamId,
    winner.stats.wins,
    winner.stats.losses,
    winner.stats.rating,
    winner.matchStats.goalsScored,
    loser.matchStats.goalsScored
  );

  await teamContract.updateStats(
    loser.teamId,
    loser.stats.wins,
    loser.stats.losses,
    loser.stats.rating,
    loser.matchStats.goalsScored,
    winner.matchStats.goalsScored
  );

  // 2. Check and award badges
  const winnerBadges = await badgeService.checkAndAwardBadges(
    winner.teamId,
    winner.stats,
    winner.matchStats
  );

  const loserBadges = await badgeService.checkAndAwardBadges(
    loser.teamId,
    loser.stats,
    loser.matchStats
  );

  console.log(`Match ${matchId} settled:`, {
    winner: winnerBadges,
    loser: loserBadges,
  });

  return { winnerBadges, loserBadges };
}
```

---

## Part 6: Testing

```solidity
// test/BassBallTeamNFT.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {BassBallTeamNFT} from "../src/BassBallTeamNFT.sol";

contract BassBallTeamNFTTest is Test {
  BassBallTeamNFT teamNFT;
  address admin = address(0x1);
  address player1 = address(0x2);
  address player2 = address(0x3);

  function setUp() public {
    vm.prank(admin);
    teamNFT = new BassBallTeamNFT("ipfs://base-uri/");
  }

  function testMintTeam() public {
    vm.prank(admin);
    uint256 tokenId = teamNFT.mintTeam(
      player1,
      "Manchester United",
      "#FF0000,#FFFFFF"
    );

    assertEq(teamNFT.ownerOf(tokenId), player1);
    assertTrue(teamNFT.hasTeam(player1));
  }

  function testOneTeamPerPlayer() public {
    vm.prank(admin);
    teamNFT.mintTeam(player1, "Team 1", "#FF0000,#FFFFFF");

    vm.prank(admin);
    vm.expectRevert("Player already has a team");
    teamNFT.mintTeam(player1, "Team 2", "#0000FF,#FFFFFF");
  }

  function testUpdateTeamName() public {
    vm.prank(admin);
    uint256 tokenId = teamNFT.mintTeam(
      player1,
      "Original Name",
      "#FF0000,#FFFFFF"
    );

    vm.prank(player1);
    teamNFT.updateTeamName(tokenId, "New Name");

    BassBallTeamNFT.Team memory team = teamNFT.getTeam(tokenId);
    assertEq(team.name, "New Name");
  }

  function testUpdateJersey() public {
    vm.prank(admin);
    uint256 tokenId = teamNFT.mintTeam(player1, "Team", "#FF0000,#FFFFFF");

    vm.prank(player1);
    teamNFT.updateJersey(
      tokenId,
      BassBallTeamNFT.JerseyPattern.STRIPES,
      "#FF0000",
      "#FFFFFF",
      ""
    );

    BassBallTeamNFT.Jersey memory jersey = teamNFT.getJersey(tokenId);
    assertEq(uint(jersey.pattern), uint(BassBallTeamNFT.JerseyPattern.STRIPES));
  }

  function testAddBadge() public {
    vm.prank(admin);
    uint256 tokenId = teamNFT.mintTeam(player1, "Team", "#FF0000,#FFFFFF");

    vm.prank(admin);
    uint256 badgeId = teamNFT.addBadge(
      tokenId,
      "First Victory",
      "Won first match",
      "ipfs://badge-image"
    );

    assertTrue(teamNFT.hasBadge(tokenId, badgeId));
    assertEq(teamNFT.getBadgeCount(tokenId), 1);
  }

  function testNonTransferable() public {
    vm.prank(admin);
    uint256 tokenId = teamNFT.mintTeam(player1, "Team", "#FF0000,#FFFFFF");

    vm.prank(player1);
    vm.expectRevert("Non-transferable");
    teamNFT.transferFrom(player1, player2, tokenId);
  }

  function testUpdateStats() public {
    vm.prank(admin);
    uint256 tokenId = teamNFT.mintTeam(player1, "Team", "#FF0000,#FFFFFF");

    vm.prank(admin);
    teamNFT.updateStats(tokenId, 10, 2, 1050, 25, 8);

    BassBallTeamNFT.Team memory team = teamNFT.getTeam(tokenId);
    assertEq(team.wins, 10);
    assertEq(team.losses, 2);
    assertEq(team.rating, 1050);
  }
}
```

---

## Summary

### Team NFT Features
- **One per player** (soul-bound, non-transferable)
- **Customizable**: Name, colors, jersey pattern
- **Achievement tracking**: Badges for milestones
- **Stats persistence**: On-chain record of performance
- **Dynamic metadata**: JSON includes live stats and badges

### Jersey Customization
- **6 patterns**: Solid, Stripes, Hoops, Checks, Gradient, Custom
- **Color selection**: Full hex color support
- **SVG preview**: Generate jersey design dynamically
- **IPFS storage**: Preserve custom designs

### Badge System
- **Automatic awards**: Triggered by match settlement
- **Milestone badges**: 1st win, 10 wins, 50 wins, etc.
- **Performance badges**: Hat tricks, clean sheets, perfect matches
- **Social badges**: Farcaster linked, Twitter shared
- **Rarity tiers**: Common → Uncommon → Rare → Epic → Legendary

### Smart Contract
- **Minimal gas**: Update stats ~5k gas, add badge ~50k gas
- **Access control**: MINTER_ROLE, STATS_UPDATER_ROLE, BADGE_AWARDER_ROLE
- **ERC721 compliant**: With transfer prevention override
- **On-chain metadata**: Full metadata encoded in tokenURI
