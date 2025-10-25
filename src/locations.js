/**
 * World Data - Locations and NPCs
 * Contains all location definitions and world structure
 * Data is now loaded from external JSON files
 */

import { dataLoader } from './dataLoader.js';

/**
 * Get locations data from the data loader
 * @returns {Object} Locations object
 */
export function getLocations() {
    return dataLoader.getLocations();
}

// For backward compatibility, export a getter
export const locations = new Proxy(
    {},
    {
        get(_target, prop) {
            return dataLoader.getLocations()[prop];
        },
        ownKeys() {
            return Object.keys(dataLoader.getLocations());
        },
        has(_target, prop) {
            return prop in dataLoader.getLocations();
        },
        getOwnPropertyDescriptor(_target, prop) {
            return {
                enumerable: true,
                configurable: true,
                value: dataLoader.getLocations()[prop]
            };
        }
    }
);
