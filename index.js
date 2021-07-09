const express = require('express')
const app = express()
const AxiosRequest = require('./axios-request');
const axiosCli = require('axios');
const fs = require('fs');
const AmazonWishList = require('./amazon-wl-parser');
const cheerio = require('cheerio');
const jwt_decode = require('jwt-decode');
const { Parser } = require('json2csv');
const BASE_URL_MX = 'https://www.amazon.com.mx';
//const PUBLIC_ID = 'JQK192QOJWAT';//wishlist
//const PUBLIC_ID = '1SC1VTTG1NF8Y';//orders
//const PUBLIC_ID = '2DHLBBQ3H4MZ5';//RANDOM STUFF
//const PUBLIC_ID='243JW7M9J5CM7';//friend 1
//const PUBLIC_ID='1Q5QNY5MBS6H0';//friend 2
//const PUBLIC_ID='1VB5EHGPH80MT'; //SAID 1
//const PUBLIC_ID='330V0S4EUR5IU';//SAID 2
//const PUBLIC_ID='48KAR1FZYNVN';//SAID 3
const PUBLIC_ID='2M2MYU2HGS5YM';//SAID 4
// https://www.amazon.com.mx/hz/wishlist/genericItemsPage/1VB5EHGPH80MT
// https://www.amazon.com.mx/hz/wishlist/genericItemsPage/330V0S4EUR5IU
// https://www.amazon.com.mx/hz/wishlist/genericItemsPage/48KAR1FZYNVN
// https://www.amazon.com.mx/hz/wishlist/genericItemsPage/2M2MYU2HGS5YM
const START_URL_WL = `/hz/wishlist/ls/${PUBLIC_ID}`;
const axios = new AxiosRequest();
const csvtojson = require("csvtojson");
const { title } = require('process');
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

    res.send('SCRAPED DONE!')
})

app.get('/reviews', async function (req, res) {
    let unique = await readFile("test.txt");
    let reviews = [];
    let listPrices = [];
    let starsReviews = [];
    let dataComments = [];
    let seeMoreUrls = [];
    let starRatings = [];
    let commentRatings = [];

    console.log("unique length: ", unique.length);
    fs.writeFile('reviews.txt', '', function (err) {
        if (err) throw err;
        //console.log('Saved review!');
    });
    const promises = [];
    for (let url of unique) {
        let promise = axiosCli.get(BASE_URL_MX + url);
        promises.push(promise);
    }
    Promise.all(promises).then(function (responses) {
        //SCRAP EVERYTHING!!!!
        // for await (let url of unique) {
        for (let response of responses) {
            let retries = 20;
            //let response = await axios.get(BASE_URL_MX + url);
            let html = response.data;
            let $ = cheerio.load(html);
            let stars = $('#averageCustomerReviews .a-icon-star .a-icon-alt').text();
            let listPrice = $('#price_inside_buybox').text();
            let seeMore = $('#reviews-medley-footer .a-link-emphasis').attr('href');
            let reviewsNumber = $('#acrCustomerReviewText').text();
            console.log("see more comments url: ", seeMore);
            //we just need the first value, we know its from 5 stars already
            let formatStars = stars.trim().split(" ")[0];
            let formatReviews = reviewsNumber.trim().split(" ")[0];
            console.log("format reviews: ", formatReviews);
            listPrices.push(listPrice);
            starsReviews.push(formatStars);
            reviews.push(formatReviews);
            seeMoreUrls.push(seeMore);
        };
        console.log("links length: ", unique.length);
        console.log('listprices length: ', listPrices.length);
        console.log('stars length: ', starsReviews.length);

        let shopItems = [];
        for (let x = 0; x < unique.length; x++) {
            let item = {
                url: unique[x],
                price: listPrices[x],
                stars: starsReviews[x],
                commentsurl: seeMoreUrls[x],
                reviews: reviews[x]
            }
            shopItems.push(item);
        }

        const fields = ['url', 'price', 'stars', 'commentsurl', 'reviews'];
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
    }).catch(function (e) {
        console.log("promise error");
    })
})

app.get('/getReviews', async function (req, res) {
    const jsonArray = await csvtojson().fromFile('./data.csv');
    const newDataArray = [];
    const learnDataArray = [];
    const articleDataArray = [];
    let fasttext = "";
    for await (let item of jsonArray) {
        if (item.commentsurl.trim() == '') continue;
        try {
            await axios.get(BASE_URL_MX + item.commentsurl).then(async function (response) {
                let html = response.data;
                let $ = cheerio.load(html);
                let reviewsArticle = [];
                let starsArticle = [];
                let labels = [];
                let titles = [];
                let title = '';
                let review = '';
                let label = '';
                $('.review-text-content span')
                    .each(function () {
                        review = $(this).text()
                        console.log(review);
                        reviewsArticle.push(review);

                    });

                $('.review-title span').each(function () {
                    title = $(this).text();
                    console.log(title);
                    titles.push(title);

                });
                $('.review-rating span')
                    .each(function () {
                        let star = $(this).text();
                        console.log(star);
                        let formatStars = star.trim().split(" ")[0];
                        starsArticle.push(formatStars);
                        if (star != undefined && star != '') {
                            if (parseInt(star) > 3) {
                                label = '__label__2';
                                labels.push(label);
                            }
                            if (parseInt(star) < 3) {
                                label = '__label__1';
                                labels.push(label);
                            }
                            else labels.push('')
                        } else { labels.push('') }
                    });

                // let reviewSpan = $('#filter-info-section .a-row span').text();
                // let commentRating = '';
                // if (reviewSpan != undefined && reviewSpan.trim() != '') {
                //     let splitreview = reviewSpan.split('|');
                //     commentRating = splitreview[1].trim().split(' ')[0];;
                // }
                let pagination = $('.a-pagination .a-last a').attr('href');
                console.log('pagination: ', pagination);
                fasttext += label + " " + title + ": " + review + "\n";

                while (pagination != undefined && pagination != '') {
                    let $ = await axios.fetchHTML(BASE_URL_MX + pagination);
                    $('.review-text-content span')
                        .each(function () {
                            review = $(this).text()
                            console.log(review);
                            reviewsArticle.push(review);

                        });

                    $('.review-title span').each(function () {
                        title = $(this).text();
                        console.log(title);
                        titles.push(title);

                    });
                    $('.review-rating span')
                        .each(function () {
                            let star = $(this).text();
                            console.log(star);
                            let formatStars = star.trim().split(" ")[0];
                            starsArticle.push(formatStars);
                            if (star != undefined && star != '') {
                                if (parseInt(star) > 3) {
                                    label = '__label__2';
                                    labels.push(label);
                                }
                                if (parseInt(star) < 3) {
                                    label = '__label__1';
                                    labels.push(label);
                                }
                                else labels.push('')
                            } else { labels.push('') }
                        });
                    pagination = $('.a-pagination .a-last a').attr('href');
                    fasttext += label + " " + title + ": " + review + "\n";
                }


                let reviewSpan = $('#filter-info-section .a-row span').text();
                let commentRating = '';
                if (reviewSpan != undefined && reviewSpan.trim() != '') {
                    let splitreview = reviewSpan.split('|');
                    commentRating = splitreview[1].trim().split(' ')[0];;
                }
                articleDataArray.push({
                    url: item.url,
                    stars: item.stars,
                    comments: commentRating,
                    price: item.price,
                    reviews: item.reviews
                });
                for (let x = 0; x < reviewsArticle.length; x++) {
                    let jsonData = {
                        stars: starsArticle[x],
                        review: reviewsArticle[x],
                        url: item.url,
                        price: item.price,
                        generalrating: item.stars,
                        commentrating: commentRating,
                        title: titles[x],
                        label: labels[x]
                    }
                    learnDataArray.push({
                        label: labels[x],
                        title: titles[x],
                        review: reviewsArticle[x]
                    });
                    newDataArray.push(jsonData);


                }
            })
        } catch (e) {
            console.log("error");
        }
    }




    // console.log("ratings: ",ratings);
    // let starRating = ratings[0].trim().split(' ')[0];
    // let commentRating = ratings[1].trim().split(' ')[0];;
    // console.log(`starsRating: ${starRating}\ncommentRating ${commentRating}`);
    // starRatings.push(starRating);
    // commentRatings.push(commentRating);

    const fields = ['url', 'price', 'stars', 'review', 'generalrating', 'commentrating', 'label', 'title'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(newDataArray);
    // fs.writeFile('articles_prods.csv', csv, function (err) {
    //     if (err) throw err;
    //     console.log("SAVED CSV DATA!");
    // });
    fs.writeFile('articles_2.csv', csv, function (err) {
        if (err) throw err;
        console.log("SAVED CSV DATA!");
    });
    const fields2 = ['label', 'title', 'review'];
    const opts2 = { fields2 };
    const parser2 = new Parser(opts2);
    const csv2 = parser2.parse(learnDataArray);
    // fs.writeFile('learndata_prods.csv', csv2, function (err) {
    //     if (err) throw err;
    //     console.log("SAVED CSV DATA!");
    // });
    fs.writeFile('learndata_wish.csv', csv2, function (err) {
        if (err) throw err;
        console.log("SAVED CSV DATA!");
    });
    fs.writeFile('fasttext_data_wl.txt', fasttext, function (err) {
        if (err) throw err;
        console.log("SAVED FAST TEXT DATA!");
    });
    // fs.writeFile('fasttext_data.txt', fasttext, function (err) {
    //     if (err) throw err;
    //     console.log("SAVED FAST TEXT DATA!");
    // });


    const fields3 = ['url', 'price', 'reviews', 'stars', 'comments'];
    const opts3 = { fields3 };
    const parser3 = new Parser(opts3);
    const csv3 = parser3.parse(articleDataArray);
    // fs.writeFile('data_prod.csv', csv3, function (err) {
    //     if (err) throw err;
    //     console.log("SAVED CSV DATA!");
    // });
    fs.writeFile('data_wishlist.csv', csv3, function (err) {
        if (err) throw err;
        console.log("SAVED CSV DATA!");
    });
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