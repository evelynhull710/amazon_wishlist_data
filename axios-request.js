const axios = require('axios');
const cheerio = require('cheerio');
class AxiosRequest {

    async get(url) {
        // let res =new Promise(async function(){
        try {
            const response = await axios.get(url);
            return response;
        } catch (e) { throw e; }

    // });
    // return res;
}
async fetchHTML(url) {
    const { data } = await axios.get(url)
    return cheerio.load(data)
  }
}
module.exports = AxiosRequest;