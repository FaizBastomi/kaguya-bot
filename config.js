const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "config.json");
module.exports = {
    /**
     * Get the json config
     * @returns {Object} the json config
     */
    getConfig() {
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify({}, null, "\t"));
        }

        return require(configPath);
    },
    /**
     * Save and reload the json config
     * @param {Object} params any json object
     * @returns 
     */
    saveAndReloadConfig(params) {
        fs.writeFileSync(configPath, JSON.stringify(params, null, "\t"));
        delete require.cache[require.resolve(configPath)];
        return require(configPath);
    }
};
