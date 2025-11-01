/**
 * IPFS Client for uploading audio files and metadata
 * Uses IPFS HTTP client for decentralized storage
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class IPFSClient {
    constructor(ipfsGateway = 'https://ipfs.io/ipfs/', apiEndpoint = 'https://api.ipfs.io/api/v0') {
        this.ipfsGateway = ipfsGateway;
        this.apiEndpoint = apiEndpoint;
    }

    /**
     * Upload file to IPFS
     * @param {Buffer|File} fileData File data
     * @param {string} fileName Optional filename
     * @returns {Promise<string>} IPFS hash
     */
    async uploadFile(fileData, fileName = 'file') {
        try {
            const formData = new FormData();
            formData.append('file', fileData, fileName);

            const response = await axios.post(
                `${this.apiEndpoint}/add`,
                formData,
                {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );

            return response.data.Hash;
        } catch (error) {
            console.error('IPFS upload error:', error);
            throw error;
        }
    }

    /**
     * Upload metadata JSON
     * @param {Object} metadata Metadata object
     * @returns {Promise<string>} IPFS hash
     */
    async uploadMetadata(metadata) {
        const jsonString = JSON.stringify(metadata);
        const buffer = Buffer.from(jsonString, 'utf-8');
        return this.uploadFile(buffer, 'metadata.json');
    }

    /**
     * Get file from IPFS
     * @param {string} ipfsHash IPFS hash
     * @returns {Promise<Buffer>} File data
     */
    async getFile(ipfsHash) {
        try {
            const response = await axios.get(`${this.ipfsGateway}${ipfsHash}`, {
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        } catch (error) {
            console.error('IPFS download error:', error);
            throw error;
        }
    }

    /**
     * Get metadata from IPFS
     * @param {string} ipfsHash IPFS hash
     * @returns {Promise<Object>} Metadata object
     */
    async getMetadata(ipfsHash) {
        try {
            const response = await axios.get(`${this.ipfsGateway}${ipfsHash}`);
            return response.data;
        } catch (error) {
            console.error('IPFS metadata fetch error:', error);
            throw error;
        }
    }
}

module.exports = IPFSClient;

