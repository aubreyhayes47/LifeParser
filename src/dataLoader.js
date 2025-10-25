/**
 * Data Loader
 * Handles asynchronous loading of game data from JSON files
 */

class DataLoader {
    constructor() {
        this.data = {
            locations: null,
            npcs: null,
            items: null,
            events: null,
            config: null,
            careers: null
        };
        this.isLoaded = false;
        this.loadingError = null;
    }

    /**
     * Load all game data files
     * @returns {Promise<boolean>} True if all data loaded successfully
     */
    async loadAll() {
        try {
            const dataFiles = {
                locations: '/data/locations.json',
                npcs: '/data/npcs.json',
                items: '/data/items.json',
                events: '/data/events.json',
                config: '/data/config.json',
                careers: '/data/careers.json'
            };

            // Load all files in parallel
            const promises = Object.entries(dataFiles).map(async ([key, path]) => {
                try {
                    const response = await fetch(path);
                    if (!response.ok) {
                        throw new Error(
                            `Failed to load ${path}: ${response.status} ${response.statusText}`
                        );
                    }
                    const data = await response.json();
                    this.data[key] = data;
                    return { key, success: true };
                } catch (error) {
                    throw new Error(`Error loading ${path}: ${error.message}`);
                }
            });

            await Promise.all(promises);

            // Validate loaded data
            this.validateData();

            this.isLoaded = true;
            return true;
        } catch (error) {
            this.loadingError = error.message;
            console.error('Data loading failed:', error);
            return false;
        }
    }

    /**
     * Validate that all required data is present and well-formed
     */
    validateData() {
        // Check locations
        if (!this.data.locations || typeof this.data.locations !== 'object') {
            throw new Error('Invalid or missing locations data');
        }

        // Check NPCs
        if (!this.data.npcs || typeof this.data.npcs !== 'object') {
            throw new Error('Invalid or missing NPCs data');
        }

        // Check items
        if (!this.data.items || typeof this.data.items !== 'object') {
            throw new Error('Invalid or missing items data');
        }

        // Check events
        if (!this.data.events || !Array.isArray(this.data.events.events)) {
            throw new Error('Invalid or missing events data');
        }

        // Check config
        if (!this.data.config || typeof this.data.config !== 'object') {
            throw new Error('Invalid or missing config data');
        }

        // Check careers
        if (!this.data.careers || typeof this.data.careers !== 'object') {
            throw new Error('Invalid or missing careers data');
        }

        // Validate that locations have required fields
        Object.entries(this.data.locations).forEach(([key, location]) => {
            if (!location.name || !location.description || !Array.isArray(location.exits)) {
                throw new Error(`Location '${key}' is missing required fields`);
            }
        });
    }

    /**
     * Get locations data
     * @returns {Object} Locations object
     */
    getLocations() {
        this.ensureLoaded();
        return this.data.locations;
    }

    /**
     * Get NPCs data
     * @returns {Object} NPCs object
     */
    getNPCs() {
        this.ensureLoaded();
        return this.data.npcs;
    }

    /**
     * Get items data
     * @returns {Object} Items object
     */
    getItems() {
        this.ensureLoaded();
        return this.data.items;
    }

    /**
     * Get events data
     * @returns {Object} Events object
     */
    getEvents() {
        this.ensureLoaded();
        return this.data.events;
    }

    /**
     * Get config data
     * @returns {Object} Config object
     */
    getConfig() {
        this.ensureLoaded();
        return this.data.config;
    }

    /**
     * Get careers data
     * @returns {Object} Careers object
     */
    getCareers() {
        this.ensureLoaded();
        return this.data.careers;
    }

    /**
     * Check if data is loaded
     * @returns {boolean} True if loaded
     */
    isDataLoaded() {
        return this.isLoaded;
    }

    /**
     * Get loading error if any
     * @returns {string|null} Error message or null
     */
    getError() {
        return this.loadingError;
    }

    /**
     * Ensure data is loaded before accessing it
     * @throws {Error} If data is not loaded
     */
    ensureLoaded() {
        if (!this.isLoaded) {
            throw new Error(
                'Data not loaded yet. Call loadAll() and wait for it to complete before accessing data.'
            );
        }
    }
}

// Create singleton instance
export const dataLoader = new DataLoader();
