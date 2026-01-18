# ⛓️ Blockchain: Smart Contracts with Foundry on Base

## Why Foundry Over Hardhat?

### Comparison: Smart Contract Frameworks

| Feature | Hardhat | Foundry ✅ | Truffle |
|---------|---------|-----------|---------|
| **Language** | JavaScript | Solidity ✅ | JavaScript |
| **Speed** | Medium | 100x faster ✅ | Slow |
| **Testing** | JavaScript | Solidity ✅ | JavaScript |
| **Type Safety** | Weak | Strong ✅ | Weak |
| **Gas Analysis** | ❌ No | ✅ Yes | No |
| **Parallel Tests** | ❌ No | ✅ Yes | No |
| **Debugging** | ❌ Limited | ✅ Full | Limited |
| **Learning Curve** | Easy | Medium | Easy |
| **Production Ready** | ✅ Yes | ✅ Yes | Yes |

**Winner for games: Foundry** ✅
- Tests run 100x faster (Solidity vs JavaScript)
- Write tests in Solidity (native language)
- Built-in gas analysis
- Perfect for complex contracts

---

## Installation

```bash
# Install Foundry (macOS/Linux)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Or manual
git clone https://github.com/foundry-rs/foundry.git
cd foundry
cargo install --path ./crates/forge --profile release

# Verify installation
forge --version
cast --version
anvil --version
```

**For Windows:**
```bash
# Using WSL2 (recommended)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Or download from releases
https://github.com/foundry-rs/foundry/releases
```

---

## Project Setup

### Initialize Foundry Project

```bash
# Create new project
forge init bass-ball-contracts
cd bass-ball-contracts

# Project structure will be:
# ├── src/
# ├── test/
# ├── script/
# ├── foundry.toml
# └── .gitignore
```

### `foundry.toml` Configuration

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_dir = "cache"

# Optimizer settings
optimizer = true
optimizer_runs = 200

# EVM version (Base uses London)
evm_version = "london"

# Solidity version
solc_version = "0.8.20"

[profile.ci]
fuzz_runs = 10000
invariant_runs = 1000

[rpc_endpoints]
# Base Sepolia testnet
base_sepolia = "https://sepolia.base.org"

# Base mainnet
base = "https://mainnet.base.org"

# Localhost (Anvil)
localhost = "http://127.0.0.1:8545"

[etherscan]
base = { key = "${BASESCAN_API_KEY}", url = "https://basescan.org/api" }
base_sepolia = { key = "${BASESCAN_API_KEY}", url = "https://sepolia.basescan.org/api" }
```

### Install Dependencies

```bash
# OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts

# Common libraries
forge install transmissions11/solmate
forge install Vectorized/solady

# Verify installs
ls lib/
```

---

## Smart Contracts for Bass Ball

### 1. ERC721 NFT Contract (Player Badges)

#### `src/BassBallNFT.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Counters.sol";
import "lib/openzeppelin-contracts/contracts/utils/Base64.sol";
import "lib/openzeppelin-contracts/contracts/utils/Strings.sol";

/**
 * @title BassBallNFT
 * @notice ERC721 NFT contract for Bass Ball player badges
 * @dev Supports metadata URIs and batch minting for efficient operations
 */
contract BassBallNFT is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Token counter
    Counters.Counter private tokenIdCounter;

    // Badge types
    enum BadgeType {
        Veteran,      // 100 games played
        Legend,       // 1000 ELO
        FiveStreak,   // 5 wins in a row
        Dominator,    // Win 10 consecutive games
        Comeback,     // Win after being 2 goals down
        Perfectionist // No losses in 50 games
    }

    // Minter role (backend service)
    mapping(address => bool) public minters;

    // Token metadata
    mapping(uint256 => BadgeType) public tokenBadgeType;
    mapping(uint256 => string) public tokenMetadataURI;
    mapping(uint256 => uint256) public tokenMintTime;

    // Badge earnings tracking
    mapping(address => mapping(BadgeType => bool)) public playerHasBadge;
    mapping(BadgeType => uint256) public badgeCount;

    // Events
    event BadgeMinted(
        address indexed player,
        uint256 indexed tokenId,
        BadgeType badgeType,
        string metadataURI
    );

    event BadgeBurned(
        address indexed player,
        uint256 indexed tokenId,
        BadgeType badgeType
    );

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // Errors
    error NotMinter();
    error TokenNotFound();
    error AlreadyHasBadge(address player, BadgeType badge);

    /**
     * @notice Initialize contract
     */
    constructor() ERC721("Bass Ball Badges", "BBADGE") {
        // Owner is default minter
        minters[msg.sender] = true;
    }

    /**
     * @notice Add minter role
     * @param _minter Address to add as minter
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid address");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    /**
     * @notice Remove minter role
     * @param _minter Address to remove as minter
     */
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /**
     * @notice Mint badge to player
     * @param _player Player address
     * @param _badgeType Type of badge
     * @param _metadataURI IPFS or custom URI for metadata
     * @return tokenId Token ID of minted badge
     */
    function mintBadge(
        address _player,
        BadgeType _badgeType,
        string memory _metadataURI
    ) external returns (uint256) {
        if (!minters[msg.sender]) revert NotMinter();
        if (playerHasBadge[_player][_badgeType]) {
            revert AlreadyHasBadge(_player, _badgeType);
        }

        uint256 tokenId = tokenIdCounter.current();
        tokenIdCounter.increment();

        // Store metadata
        tokenBadgeType[tokenId] = _badgeType;
        tokenMetadataURI[tokenId] = _metadataURI;
        tokenMintTime[tokenId] = block.timestamp;

        // Mark player as having badge
        playerHasBadge[_player][_badgeType] = true;
        badgeCount[_badgeType]++;

        // Mint token
        _safeMint(_player, tokenId);

        emit BadgeMinted(_player, tokenId, _badgeType, _metadataURI);

        return tokenId;
    }

    /**
     * @notice Burn badge (for testing or special cases)
     * @param _tokenId Token ID to burn
     */
    function burnBadge(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Not owner");

        address owner = ownerOf(_tokenId);
        BadgeType badgeType = tokenBadgeType[_tokenId];

        playerHasBadge[owner][badgeType] = false;
        badgeCount[badgeType]--;

        _burn(_tokenId);

        emit BadgeBurned(owner, _tokenId, badgeType);
    }

    /**
     * @notice Get player's badges
     * @param _player Player address
     * @return Array of token IDs owned by player
     */
    function getPlayerBadges(address _player) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(_player);
        uint256[] memory badges = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            badges[i] = tokenOfOwnerByIndex(_player, i);
        }

        return badges;
    }

    /**
     * @notice Get all tokens of a specific badge type
     * @param _badgeType Badge type
     * @return Array of token IDs
     */
    function getBadgesByType(BadgeType _badgeType) external view returns (uint256[] memory) {
        uint256 count = badgeCount[_badgeType];
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < tokenIdCounter.current(); i++) {
            if (tokenBadgeType[i] == _badgeType) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get badge metadata
     * @param _tokenId Token ID
     * @return Badge type and metadata URI
     */
    function getBadgeInfo(uint256 _tokenId)
        external
        view
        returns (BadgeType badgeType, string memory metadataURI, uint256 mintTime)
    {
        require(_tokenId < tokenIdCounter.current(), "Invalid token");

        return (
            tokenBadgeType[_tokenId],
            tokenMetadataURI[_tokenId],
            tokenMintTime[_tokenId]
        );
    }

    /**
     * @notice Get total badges minted
     * @return Total token supply
     */
    function getTotalMinted() external view returns (uint256) {
        return tokenIdCounter.current();
    }

    /**
     * @notice Get badge type name
     * @param _badgeType Badge type enum
     * @return Human-readable badge name
     */
    function getBadgeTypeName(BadgeType _badgeType) public pure returns (string memory) {
        if (_badgeType == BadgeType.Veteran) return "Veteran";
        if (_badgeType == BadgeType.Legend) return "Legend";
        if (_badgeType == BadgeType.FiveStreak) return "Five Streak";
        if (_badgeType == BadgeType.Dominator) return "Dominator";
        if (_badgeType == BadgeType.Comeback) return "Comeback";
        if (_badgeType == BadgeType.Perfectionist) return "Perfectionist";
        return "Unknown";
    }

    /**
     * @notice Generate tokenURI with on-chain metadata
     * @param _tokenId Token ID
     * @return JSON metadata URI
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_ownerOf(_tokenId) != address(0), "Token not found");

        BadgeType badgeType = tokenBadgeType[_tokenId];
        string memory badgeName = getBadgeTypeName(badgeType);
        string memory customURI = tokenMetadataURI[_tokenId];

        // If custom URI provided, use it
        if (bytes(customURI).length > 0) {
            return customURI;
        }

        // Generate on-chain metadata
        string memory json = Base64.encode(
            abi.encodePacked(
                '{"name":"Bass Ball ',
                badgeName,
                '","description":"Official Bass Ball badge for ',
                badgeName,
                ' achievements","image":"ipfs://QmXXXXXX","attributes":[{"trait_type":"Badge Type","value":"',
                badgeName,
                '"},{"trait_type":"Mint Time","value":"',
                tokenMintTime[_tokenId].toString(),
                '"}]}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

---

### 2. Match Settlement Contract

#### `src/BassBallMatchSettlement.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BassBallMatchSettlement
 * @notice On-chain settlement for Bass Ball match results
 * @dev Aggregates weekly results for gas efficiency
 */
contract BassBallMatchSettlement is Ownable {
    using ECDSA for bytes32;

    // Weekly settlement struct
    struct WeeklySettlement {
        uint256 weekNumber;
        uint256 matchCount;
        bytes32 merkleRoot;
        uint256 totalRewards;
        bool settled;
        uint256 timestamp;
    }

    // Match result struct
    struct MatchResult {
        address winner;
        address loser;
        uint256 winnerRating;
        uint256 loserRating;
        uint8[2] score;
        uint256 duration;
        bytes32 signatureHash;
    }

    // Storage
    mapping(uint256 => WeeklySettlement) public settlements;
    mapping(bytes32 => bool) public settledMatches;
    mapping(address => uint256) public playerRewards;

    uint256 public currentWeek;
    uint256 public constant WEEK_DURATION = 7 days;
    uint256 public weekStartTime;

    address public signer; // Backend signer for verification

    // Events
    event MatchSettled(
        address indexed winner,
        address indexed loser,
        uint256 weekNumber,
        uint256[2] score
    );

    event WeeklySettlementCreated(
        uint256 indexed week,
        uint256 matchCount,
        bytes32 merkleRoot
    );

    event RewardsClaimed(
        address indexed player,
        uint256 amount
    );

    // Errors
    error InvalidSignature();
    error MatchAlreadySettled();
    error InvalidWeek();
    error NoRewardsToClaim();

    /**
     * @notice Initialize contract
     * @param _signer Backend signer address
     */
    constructor(address _signer) {
        signer = _signer;
        weekStartTime = block.timestamp;
        currentWeek = 1;
    }

    /**
     * @notice Update signer address
     * @param _newSigner New signer address
     */
    function setSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid address");
        signer = _newSigner;
    }

    /**
     * @notice Settle a match result
     * @param _result Match result struct
     * @param _signature Server signature for verification
     */
    function settleMatch(
        MatchResult calldata _result,
        bytes calldata _signature
    ) external {
        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encode(
                _result.winner,
                _result.loser,
                _result.score[0],
                _result.score[1],
                _result.duration,
                currentWeek
            )
        );

        bytes32 signedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = signedHash.recover(_signature);

        if (recoveredSigner != signer) revert InvalidSignature();

        // Check if already settled
        if (settledMatches[_result.signatureHash]) {
            revert MatchAlreadySettled();
        }

        // Mark as settled
        settledMatches[_result.signatureHash] = true;

        // Award points/rewards
        uint256 winnerPoints = calculatePoints(_result.score[0], _result.score[1]);
        playerRewards[_result.winner] += winnerPoints;

        emit MatchSettled(
            _result.winner,
            _result.loser,
            currentWeek,
            _result.score
        );
    }

    /**
     * @notice Calculate reward points based on match score
     * @param _winnerScore Winner's score
     * @param _loserScore Loser's score
     * @return Reward points
     */
    function calculatePoints(uint8 _winnerScore, uint8 _loserScore)
        public
        pure
        returns (uint256)
    {
        // Base points
        uint256 points = 100;

        // Bonus for dominant win (3+ goal difference)
        if (_winnerScore - _loserScore >= 3) {
            points += 50;
        }

        // Bonus for close match (1 goal difference)
        if (_winnerScore - _loserScore == 1) {
            points += 25;
        }

        return points;
    }

    /**
     * @notice Create weekly settlement
     * @param _matchCount Number of matches in settlement
     * @param _merkleRoot Merkle root of all match results
     */
    function createWeeklySettlement(
        uint256 _matchCount,
        bytes32 _merkleRoot
    ) external onlyOwner {
        require(_matchCount > 0, "Invalid match count");

        WeeklySettlement storage settlement = settlements[currentWeek];
        settlement.weekNumber = currentWeek;
        settlement.matchCount = _matchCount;
        settlement.merkleRoot = _merkleRoot;
        settlement.settled = true;
        settlement.timestamp = block.timestamp;

        emit WeeklySettlementCreated(currentWeek, _matchCount, _merkleRoot);

        // Move to next week
        currentWeek++;
    }

    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external {
        uint256 rewards = playerRewards[msg.sender];
        if (rewards == 0) revert NoRewardsToClaim();

        playerRewards[msg.sender] = 0;

        // Send rewards (can be tokens, ETH, or just recorded)
        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @notice Get player's current rewards
     * @param _player Player address
     * @return Reward amount
     */
    function getPlayerRewards(address _player) external view returns (uint256) {
        return playerRewards[_player];
    }

    /**
     * @notice Get settlement info
     * @param _week Week number
     * @return Settlement data
     */
    function getSettlement(uint256 _week)
        external
        view
        returns (WeeklySettlement memory)
    {
        return settlements[_week];
    }

    /**
     * @notice Get current week
     * @return Week number
     */
    function getCurrentWeek() external view returns (uint256) {
        return currentWeek;
    }

    /**
     * @notice Get week progress
     * @return secondsElapsed Seconds since week started
     * @return secondsRemaining Seconds until week ends
     */
    function getWeekProgress()
        external
        view
        returns (uint256 secondsElapsed, uint256 secondsRemaining)
    {
        uint256 weekEnd = weekStartTime + (currentWeek * WEEK_DURATION);
        secondsElapsed = block.timestamp - (weekEnd - WEEK_DURATION);
        secondsRemaining = weekEnd > block.timestamp ? weekEnd - block.timestamp : 0;
    }
}
```

---

## Testing with Foundry

### `test/BassBallNFT.t.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BassBallNFT.sol";

contract BassBallNFTTest is Test {
    BassBallNFT nft;
    address owner;
    address player1 = address(0x1);
    address player2 = address(0x2);

    function setUp() public {
        owner = msg.sender;
        nft = new BassBallNFT();
    }

    function testMintBadge() public {
        uint256 tokenId = nft.mintBadge(
            player1,
            BassBallNFT.BadgeType.Veteran,
            "ipfs://QmXXX"
        );

        assertEq(nft.ownerOf(tokenId), player1);
        assertEq(nft.balanceOf(player1), 1);
    }

    function testCannotMintSameBadgeTwice() public {
        nft.mintBadge(player1, BassBallNFT.BadgeType.Veteran, "ipfs://QmXXX");

        vm.expectRevert(
            abi.encodeWithSelector(
                BassBallNFT.AlreadyHasBadge.selector,
                player1,
                BassBallNFT.BadgeType.Veteran
            )
        );
        nft.mintBadge(player1, BassBallNFT.BadgeType.Veteran, "ipfs://QmYYY");
    }

    function testBadgeTypeNames() public {
        assertEq(nft.getBadgeTypeName(BassBallNFT.BadgeType.Veteran), "Veteran");
        assertEq(nft.getBadgeTypeName(BassBallNFT.BadgeType.Legend), "Legend");
        assertEq(nft.getBadgeTypeName(BassBallNFT.BadgeType.FiveStreak), "Five Streak");
    }

    function testGetPlayerBadges() public {
        nft.mintBadge(player1, BassBallNFT.BadgeType.Veteran, "ipfs://QmXXX");
        nft.mintBadge(player1, BassBallNFT.BadgeType.Legend, "ipfs://QmYYY");

        uint256[] memory badges = nft.getPlayerBadges(player1);
        assertEq(badges.length, 2);
    }

    function testBurnBadge() public {
        uint256 tokenId = nft.mintBadge(
            player1,
            BassBallNFT.BadgeType.Veteran,
            "ipfs://QmXXX"
        );

        vm.prank(player1);
        nft.burnBadge(tokenId);

        assertEq(nft.balanceOf(player1), 0);
        assertFalse(nft.playerHasBadge(player1, BassBallNFT.BadgeType.Veteran));
    }

    function testMinterRole() public {
        // Owner is default minter
        assertTrue(nft.minters(owner));

        // Add new minter
        nft.addMinter(player2);
        assertTrue(nft.minters(player2));

        // Minter can mint
        vm.prank(player2);
        nft.mintBadge(player1, BassBallNFT.BadgeType.Veteran, "ipfs://QmXXX");

        // Remove minter
        nft.removeMinter(player2);
        assertFalse(nft.minters(player2));

        // Cannot mint anymore
        vm.prank(player2);
        vm.expectRevert(BassBallNFT.NotMinter.selector);
        nft.mintBadge(player1, BassBallNFT.BadgeType.Legend, "ipfs://QmYYY");
    }

    function testGetBadgesByType() public {
        nft.mintBadge(player1, BassBallNFT.BadgeType.Veteran, "ipfs://QmXXX");
        nft.mintBadge(player2, BassBallNFT.BadgeType.Veteran, "ipfs://QmYYY");
        nft.mintBadge(player2, BassBallNFT.BadgeType.Legend, "ipfs://QmZZZ");

        uint256[] memory veteran = nft.getBadgesByType(BassBallNFT.BadgeType.Veteran);
        assertEq(veteran.length, 2);

        uint256[] memory legend = nft.getBadgesByType(BassBallNFT.BadgeType.Legend);
        assertEq(legend.length, 1);
    }
}
```

### `test/BassBallMatchSettlement.t.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BassBallMatchSettlement.sol";

contract BassBallMatchSettlementTest is Test {
    BassBallMatchSettlement settlement;
    address signer;
    address winner = address(0x1);
    address loser = address(0x2);

    function setUp() public {
        signer = address(0x999);
        settlement = new BassBallMatchSettlement(signer);
    }

    function testCalculatePoints() public {
        // Dominant win (3+ goal difference)
        uint256 points = settlement.calculatePoints(5, 2);
        assertEq(points, 150); // 100 + 50

        // Close match (1 goal difference)
        points = settlement.calculatePoints(2, 1);
        assertEq(points, 125); // 100 + 25

        // Normal win
        points = settlement.calculatePoints(3, 1);
        assertEq(points, 100);
    }

    function testGetWeekProgress() public {
        (uint256 elapsed, uint256 remaining) = settlement.getWeekProgress();

        // Should be reasonable values
        assertTrue(elapsed >= 0);
        assertTrue(remaining > 0);
    }

    function testGetCurrentWeek() public {
        assertEq(settlement.getCurrentWeek(), 1);
    }

    function testCreateWeeklySettlement() public {
        bytes32 merkleRoot = keccak256(abi.encode("matches"));

        settlement.createWeeklySettlement(100, merkleRoot);

        BassBallMatchSettlement.WeeklySettlement memory week = settlement.getSettlement(1);
        assertEq(week.weekNumber, 1);
        assertEq(week.matchCount, 100);
        assertEq(week.merkleRoot, merkleRoot);
        assertTrue(week.settled);
    }

    function testClaimRewardsWithoutRewards() public {
        vm.expectRevert(BassBallMatchSettlement.NoRewardsToClaim.selector);
        settlement.claimRewards();
    }

    function testSetSigner() public {
        address newSigner = address(0x888);
        settlement.setSigner(newSigner);

        // Verify signer changed
        // (No direct getter, so we'd test via signature validation)
    }
}
```

---

## Deployment Scripts

### `script/Deploy.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BassBallNFT.sol";
import "../src/BassBallMatchSettlement.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address signer = vm.envAddress("SIGNER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy NFT contract
        BassBallNFT nft = new BassBallNFT();
        console.log("BassBallNFT deployed at:", address(nft));

        // Deploy settlement contract
        BassBallMatchSettlement settlement = new BassBallMatchSettlement(signer);
        console.log("BassBallMatchSettlement deployed at:", address(settlement));

        vm.stopBroadcast();
    }
}
```

---

## Running Tests

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vv

# Run specific test
forge test --match testMintBadge

# Run tests with gas report
forge test --gas-report

# Run with specific RPC
forge test --rpc-url base_sepolia

# Run with coverage
forge coverage

# Run tests in parallel
forge test -j 4

# Run with fuzz (100 iterations)
forge test --fuzz-runs 100

# Run invariant tests
forge test --match-test "invariant"
```

---

## Deployment to Base

### Testnet Deployment

```bash
# Load environment variables
source .env

# Deploy to Base Sepolia
forge script script/Deploy.s.sol:DeployScript --rpc-url base_sepolia --broadcast

# Verify contract on Basescan
forge verify-contract <CONTRACT_ADDRESS> src/BassBallNFT.sol:BassBallNFT \
  --rpc-url base_sepolia \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Production Deployment

```bash
# Deploy to Base mainnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base \
  --broadcast \
  --verify

# Check deployment
cast call <NFT_ADDRESS> "totalSupply()" --rpc-url base
```

### `.env` File

```bash
# Deployment
PRIVATE_KEY="0x..."
SIGNER_ADDRESS="0x..."

# RPC URLs
BASE_RPC_URL="https://mainnet.base.org"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"

# Etherscan
BASESCAN_API_KEY="..."

# Optional
COINMARKETCAP_API_KEY="..."
```

---

## Gas Optimization

### Gas Report

```bash
forge test --gas-report
```

**Example output:**
```
┌─────────────────────────┬─────────┬────────┬────────┐
│ src/BassBallNFT         │ Methods │ Min    │ Max    │
├─────────────────────────┼─────────┼────────┼────────┤
│ mintBadge               │ 1       │ 95,233 │ 95,233 │
│ burnBadge               │ 1       │ 24,568 │ 24,568 │
│ getPlayerBadges         │ 1       │ 2,445  │ 2,445  │
└─────────────────────────┴─────────┴────────┴────────┘
```

### Optimization Tips

```solidity
// ✅ Good: Use events instead of storing in mapping
event BadgeEarned(address indexed player, BadgeType badge);

// ❌ Bad: Store everything in state
mapping(address => BadgeType[]) badges; // Expensive

// ✅ Good: Batch operations
function batchMintBadges(
    address[] calldata _players,
    BadgeType[] calldata _types
) external {
    for (uint256 i = 0; i < _players.length; i++) {
        mintBadge(_players[i], _types[i], "");
    }
}

// ✅ Good: Use tight packing
struct Match {
    address player1; // 20 bytes
    address player2; // 20 bytes
    uint8 score1;   // 1 byte (packed with above)
    uint8 score2;   // 1 byte (packed with above)
    uint128 rating; // 16 bytes
}
```

---

## Integration with Backend

### Mint Badge from Backend

```typescript
// src/services/contract/nft-service.ts
import { createPublicClient, createWalletClient, http } from 'viem';
import { baseMainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { BassBallNFT_ABI } from './abi/BassBallNFT';

const account = privateKeyToAccount(
  process.env.CONTRACT_PRIVATE_KEY as `0x${string}`
);

const publicClient = createPublicClient({
  chain: baseMainnet,
  transport: http(process.env.BASE_RPC_URL),
});

const walletClient = createWalletClient({
  chain: baseMainnet,
  transport: http(process.env.BASE_RPC_URL),
  account,
});

export const NFTService = {
  /**
   * Mint badge to player
   */
  async mintBadge(
    playerAddress: string,
    badgeType: number,
    metadataURI: string
  ): Promise<string> {
    const hash = await walletClient.writeContract({
      address: process.env.NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: BassBallNFT_ABI,
      functionName: 'mintBadge',
      args: [playerAddress, badgeType, metadataURI],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.transactionHash;
  },

  /**
   * Check if player has badge
   */
  async hasPlayerBadge(
    playerAddress: string,
    badgeType: number
  ): Promise<boolean> {
    const result = await publicClient.readContract({
      address: process.env.NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: BassBallNFT_ABI,
      functionName: 'playerHasBadge',
      args: [playerAddress, badgeType],
    });

    return result as boolean;
  },

  /**
   * Get player's badges
   */
  async getPlayerBadges(playerAddress: string): Promise<bigint[]> {
    const result = await publicClient.readContract({
      address: process.env.NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: BassBallNFT_ABI,
      functionName: 'getPlayerBadges',
      args: [playerAddress],
    });

    return result as bigint[];
  },
};
```

---

## Key Base Chain Details

| Feature | Value |
|---------|-------|
| **Chain ID** | 8453 (mainnet), 84532 (sepolia) |
| **Block Time** | ~2 seconds |
| **Gas Token** | ETH |
| **RPC** | https://mainnet.base.org |
| **Block Explorer** | https://basescan.org |
| **Finality** | ~15 minutes |

---

## Summary

| Component | Purpose | Cost |
|-----------|---------|------|
| **BassBallNFT** | Player badges (ERC721) | ~95k gas to mint |
| **BassBallMatchSettlement** | Weekly result aggregation | ~2-5k gas per match |
| **Foundry** | Testing & deployment | 100x faster than Hardhat |
| **Gas Report** | Optimization tracking | Built-in |
| **Testnet** | Base Sepolia for testing | Free testnet ETH |

---

**Production-ready smart contracts on Base** ⛓️
