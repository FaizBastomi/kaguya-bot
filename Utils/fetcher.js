const fetch = require('node-fetch')

/**
 * Fetch Json from Url
 * @param {String} url string
 */
async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
        .then(res => res.json())
        .then(json => resolve(json))
        .catch(err => reject(err))
    })
}

module.exports = {
    fetchJson
}