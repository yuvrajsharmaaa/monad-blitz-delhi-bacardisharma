/**
 * Metadata schema for music tracks and remixes
 */

/**
 * Create metadata JSON for original track
 * @param {Object} params Track parameters
 * @returns {Object} Metadata object
 */
function createTrackMetadata({
    title,
    creator,
    creatorAddress,
    ipfsHash,
    audioHash,
    description = '',
    genre = '',
    duration = 0,
}) {
    return {
        title,
        creator,
        creatorAddress,
        ipfsHash,
        audioHash,
        description,
        genre,
        duration,
        timestamp: Date.now(),
        type: 'original',
        version: '1.0',
    };
}

/**
 * Create metadata JSON for remix
 * @param {Object} params Remix parameters
 * @returns {Object} Metadata object
 */
function createRemixMetadata({
    title,
    creator,
    creatorAddress,
    remixOf,
    ipfsHash,
    audioHash,
    description = '',
    genre = '',
    duration = 0,
}) {
    return {
        title,
        creator,
        creatorAddress,
        remixOf,
        ipfsHash,
        audioHash,
        description,
        genre,
        duration,
        timestamp: Date.now(),
        type: 'remix',
        version: '1.0',
    };
}

module.exports = {
    createTrackMetadata,
    createRemixMetadata,
};

