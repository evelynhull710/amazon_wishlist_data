const axios = require('axios');
const cheerio = require('cheerio');
class AxiosRequest {

    async get(url) {
        try {
            const response = await axios.get(url);
            return response;
        } catch (e) { throw e; }
    }

    async getPromise(url) {
        try {
           const response= await axios.get(url, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }).then((response) => {
                return response
            }).catch(function (error) {
                console.error('[axios get promise error]:', error)
            })
            return response
        } catch (e) { return {error:e}}

    }
    async fetchHTML(url) {
        const { data } = await axios.get(url)
        return cheerio.load(data)
    }
}
module.exports = AxiosRequest;