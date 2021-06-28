const express = require('express')
const app = express()
const axios = require('axios');
const fs = require('fs');
const AmazonWishList = require('./amazon-wl-parser');
const cheerio = require('cheerio');
const jwt_decode = require('jwt-decode');
const { Parser } = require('json2csv');
const BASE_URL_MX = 'https://www.amazon.com.mx';
const PUBLIC_ID = 'JQK192QOJWAT'
const START_URL_WL = `/hz/wishlist/ls/${PUBLIC_ID}`;
// var AmazonWishList = require('amazon-wish-list');
// var awl = new AmazonWishList.default('JQK192QOJWAT');
//https://github.com/stylesuxx/amazon-wish-list

//US WISHLIST ID: 3EGL33WZPAJ8Q
//MX WISHLIST ID: JQK192QOJWAT

//URL MX https://www.amazon.com.mx/hz/wishlist/ls/(YOUR PUBLIC ID)
//URL US https://www.amazon.com/hz/wishlist/ls/(YOUR PUBLIC ID)

//is just different in mx 

app.get('/wishlist', async function (req, res) {
    let nextPageUrl = '';

    //lets got those items
    let response = await axios.get(BASE_URL_MX + START_URL_WL);
    //showMoreUrl   <- input name that has next url
    let html = response.data;
    let $ = cheerio.load(html);
    let title = $('#profile-list-name').text();
    let itemTitles = $('h3 .a-link-normal').text();
    let urlValues = $('.showMoreUrl').val();;
    let itemLinks = $('h3 .a-link-normal').attr('id');
    let links = [];
    $('h3 .a-link-normal').each(function () {
        const href =
            $(this).attr('href');
        console.log('link: ', href);
        links.push(href);
    });
    console.log('items id: ', itemLinks);

    let prices = [];
    let pageUrls = [];

    $('.price-section').text().split('\n').forEach(element => {
        if (element.trim() != '' && element.trim().startsWith('$')) {
            prices.push(element.trim());
        }
    });

    let titles = [];
    itemTitles.split('\n').forEach(element => {
        if (element.trim() != '')
            titles.push(element);
    });

    let duplicated = false;
    while (!duplicated) {
        nextPageUrl = urlValues;
        if (pageUrls.includes(nextPageUrl)) { duplicated = true; break; }
        pageUrls.push(nextPageUrl);
        let response = await axios.get(BASE_URL_MX + nextPageUrl);
        html = response.data;
        $ = cheerio.load(html);
        title = $('#profile-list-name').text();
        itemTitles = $('h3 .a-link-normal').text();
        $('h3 .a-link-normal').each(function () {
            const href =
                $(this).attr('href');
            console.log('link: ', href);
            links.push(href);
        });
        urlValues = $('.showMoreUrl').val();;
        $('.price-section').text().split('\n').forEach(element => {
            if (element.trim() != '' && element.trim().startsWith('$')) {
                prices.push(element.trim());
            }
        });

        itemTitles.split('\n').forEach(element => {
            if (element.trim() != '')
                titles.push(element);
        });
    }


    let unique = links.filter((v, i, a) => a.indexOf(v) === i);
    fs.writeFile('test.txt', unique.join('\n'), function (err) {
        if (err) throw err;
        console.log('Saved!');
    });


    let reviews = [];
    let listPrices = [];
    let starsReviews = [];

    //SCRAP EVERYTHING!!!!
    await unique.forEach(async url => {
        let response = await axios.get(BASE_URL_MX + url);
        let html = response.data;
        let $ = cheerio.load(html);
        let stars = $('#averageCustomerReviews .a-icon-star .a-icon-alt').text();
        let listPrice = $('#price_inside_buybox').text();
        listPrices.push(listPrice);
        console.log('listprice: ', listPrice);
        console.log('stars: ', stars);
        starsReviews.push(stars);
        $('.cr-original-review-content').each(function () {
            const text =
                $(this).text();
            // console.log('link: ', text);
            reviews.push(text);
            fs.appendFile('reviews.txt', text + "\n", function (err) {
                if (err) throw err;
                //console.log('Saved review!');
            });
        });




        //console.log("review: ",review);
        // console.log("STARS: ",stars);
    });
    console.log("links length: ", unique.length);
    console.log('listprices length: ', listPrices.length);
    fs.writeFile('prices.txt', listPrices.join('\n'), function (err) {
        if (err) throw err;
        // console.log('Saved prices!');
    });

    res.send('SCRAPED DONE!')
})

app.get('/reviews', async function (req, res) {
    let unique = await readFile("test.txt");
    let reviews = [];
    let listPrices = [];
    let starsReviews = [];
    let dataComments = [];
    let seeMoreUrls = [];
    console.log("unique length: ", unique.length);
    fs.writeFile('reviews.txt', '', function (err) {
        if (err) throw err;
        //console.log('Saved review!');
    });
    //SCRAP EVERYTHING!!!!
    for await (let url of unique) {

        let retries = 20;
        let response = await axios.get(BASE_URL_MX + url);
        let html = response.data;
        let $ = cheerio.load(html);
        let stars = $('#averageCustomerReviews .a-icon-star .a-icon-alt').text();
        let listPrice = $('#price_inside_buybox').text();
        let seeMore = $('#cr-pagination-footer-0 .a-link-emphasis').attr('href');

        console.log("see more comments url: ", seeMore);
        //we just need the first value, we know its from 5 stars already
        let formatStars = stars.trim().split(" ")[0];
        listPrices.push(listPrice);
        starsReviews.push(formatStars);

        // if (seeMore == undefined) {
        //     $('.cr-original-review-content').each(function () {
        //         const text =
        //             $(this).text();
        //         let dataItem = {
        //             url: url,
        //             globalStars: formatStars,
        //             price: listPrice,
        //             comment: text,
        //         };
        //         dataComments.push(dataItem);
        //         fs.appendFile('reviews.txt', text + "\n", function (err) {
        //             if (err) throw err;
        //             //console.log('Saved review!');
        //         });
        //     });
        // } else {
            if(seeMore!=undefined){
            let response = await axios.get(BASE_URL_MX + seeMore);
            let html = response.data;
            let $ = cheerio.load(html);
            let ratings = $('#filter-info-section span').text().split('|');
            let starRating = ratings[0].trim().split(' ')[0];
            let commentRating = ratings[1].trim().split(' ')[0];;
            console.log(`starsRating: ${starRating}\ncommentRating ${commentRating}`);
            $('.cr-original-review-content').each(function () { 

                let commentSection=$('.a-section .review .aok-relative').each(function(i,element){
                    
                });
                console.log(commentSection);
            });
        }
    };
    console.log("links length: ", unique.length);
    console.log('listprices length: ', listPrices.length);
    console.log('stars length: ', starsReviews.length);

    let shopItems = [];
    for (let x = 0; x < unique.length; x++) {
        let item = {
            url: unique[x],
            price: listPrices[x],
            stars: starsReviews[x]
        }
        shopItems.push(item);
    }

    const fields = ['url', 'price', 'stars'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(shopItems);
    fs.writeFile('data.csv', csv, function (err) {
        if (err) throw err;
        console.log("SAVED CSV DATA!");
    });
    fs.writeFile('prices.txt', listPrices.join('\n'), function (err) {
        if (err) throw err;
    });

    res.send('hello world')
})


app.get('/', function (req, res) {
    res.send('hello world')
})

async function readFile(filename) {
    const fileArray = [];
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(filename)
    });

    //    await lineReader.on('line', function (line) {
    //         fileArray.push(line);
    //         console.log('Line from file:', line);

    //     });

    for await (const line of lineReader) {
        console.log(line);
        fileArray.push(line);
    }
    return fileArray;
}

var server = app.listen(5001);

server.on('connection', function (socket) {
    console.log("A new connection was made by a client.");
    socket.setTimeout(30000 * 1000);
    // 30 second timeout. Change this as you see fit.
});

app.listen(3000)
console.log("API LISTENING ON PORT 3000")