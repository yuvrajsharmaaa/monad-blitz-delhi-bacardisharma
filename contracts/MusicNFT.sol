// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MusicNFT
 * @dev NFT contract for minting original tracks and remixes
 * Optimized for Monad with calldata and storage optimizations
 */
contract MusicNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    struct TrackMetadata {
        uint256 tokenId;
        string ipfsHash;      // Only store IPFS hash (minimal storage)
        uint256 timestamp;
        address creator;
        bool isRemix;
        uint256 remixOf;      // 0 if original, tokenId if remix
    }
    
    mapping(uint256 => TrackMetadata) public tracks;
    mapping(address => uint256[]) public creatorTracks;
    
    event TrackMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string ipfsHash,
        bool isRemix,
        uint256 remixOf
    );
    
    constructor() ERC721("MusicRemixNFT", "MRNFT") Ownable(msg.sender) {}
    
    /**
     * @dev Mint an original track NFT
     * @param ipfsHash IPFS hash of the metadata JSON
     */
    function mintOriginal(string calldata ipfsHash) external returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsHash)));
        
        tracks[tokenId] = TrackMetadata({
            tokenId: tokenId,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            creator: msg.sender,
            isRemix: false,
            remixOf: 0
        });
        
        creatorTracks[msg.sender].push(tokenId);
        
        emit TrackMinted(tokenId, msg.sender, ipfsHash, false, 0);
        return tokenId;
    }
    
    /**
     * @dev Mint a remix NFT linked to parent track
     * @param remixOf Original track token ID
     * @param ipfsHash IPFS hash of remix metadata
     */
    function mintRemix(uint256 remixOf, string calldata ipfsHash) external returns (uint256) {
        require(ownerOf(remixOf) != address(0), "Parent track does not exist");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsHash)));
        
        tracks[tokenId] = TrackMetadata({
            tokenId: tokenId,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            creator: msg.sender,
            isRemix: true,
            remixOf: remixOf
        });
        
        creatorTracks[msg.sender].push(tokenId);
        
        emit TrackMinted(tokenId, msg.sender, ipfsHash, true, remixOf);
        return tokenId;
    }
    
    function getTrack(uint256 tokenId) external view returns (TrackMetadata memory) {
        return tracks[tokenId];
    }
    
    function getCreatorTracks(address creator) external view returns (uint256[] memory) {
        return creatorTracks[creator];
    }
}

