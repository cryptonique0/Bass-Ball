// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FootballPlayerNFT
 * @dev NFT contract for player cards on Bass Chain
 */
contract FootballPlayerNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct Player {
        string name;
        string position;
        uint8 pace;
        uint8 shooting;
        uint8 passing;
        uint8 dribbling;
        uint8 defense;
        uint8 physical;
        uint256 rarity; // 1: Common, 2: Rare, 3: Epic, 4: Legendary
    }

    mapping(uint256 => Player) public players;
    mapping(address => uint256[]) public playerTokens;

    event PlayerMinted(address indexed to, uint256 indexed tokenId, string name, uint256 rarity);
    event PlayerBurned(uint256 indexed tokenId);

    constructor() ERC721("FootballPlayerNFT", "PLAYER") {}

    /**
     * @dev Mint a new player NFT
     */
    function mintPlayer(
        address to,
        string memory name,
        string memory position,
        uint8 pace,
        uint8 shooting,
        uint8 passing,
        uint8 dribbling,
        uint8 defense,
        uint8 physical,
        uint256 rarity,
        string memory uri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        players[tokenId] = Player({
            name: name,
            position: position,
            pace: pace,
            shooting: shooting,
            passing: passing,
            dribbling: dribbling,
            defense: defense,
            physical: physical,
            rarity: rarity
        });

        playerTokens[to].push(tokenId);
        emit PlayerMinted(to, tokenId, name, rarity);

        return tokenId;
    }

    /**
     * @dev Get player stats
     */
    function getPlayerStats(uint256 tokenId) public view returns (Player memory) {
        require(_exists(tokenId), "Token does not exist");
        return players[tokenId];
    }

    /**
     * @dev Get overall rating for a player
     */
    function getOverallRating(uint256 tokenId) public view returns (uint8) {
        require(_exists(tokenId), "Token does not exist");
        Player memory player = players[tokenId];
        uint256 total = uint256(player.pace)
            + player.shooting
            + player.passing
            + player.dribbling
            + player.defense
            + player.physical;
        return uint8(total / 6);
    }

    /**
     * @dev Get player tokens for an address
     */
    function getPlayerTokens(address owner) public view returns (uint256[] memory) {
        return playerTokens[owner];
    }

    /**
     * @dev Burn a player token
     */
    function burnPlayer(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        _burn(tokenId);
        emit PlayerBurned(tokenId);
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
