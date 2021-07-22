const AxiosRequest = require('./axios-request');
const axiosCli = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');
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
const PUBLIC_ID = '2M2MYU2HGS5YM';//SAID 4
const SCRAP_ROUTE = 'ScrapFiles';
const ScrapFolders = {
  FRIENDS: '/Friends',
  ORDERS: '/Order_history',
  WISHLIST: 'Wishlist'
}
const axios = new AxiosRequest();
const csvtojson = require("csvtojson");
class AmazonWishList {

  async getWishlistArticles(start_url, fileLoc) {
    // const response = {}
    try {
      let nextPageUrl = '';
      const response = await axios.getPromise(BASE_URL_MX + start_url)
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
      fs.writeFile(`${fileLoc}/links.txt`, unique.join('\n'), function (err) {
        if (err) throw err;
        console.log('Saved!');
      });
    } catch (e) {
      console.error(`[getWishlistArticles][error]:${e}`)
    }
  }

  async getArticleData(fileLoc) {
    let unique = await this.readFile(`${fileLoc}/links.txt`);
    await this.extractLinksData(unique, fileLoc)
  }

  async extractLinksData(array, fileLoc) {
    const response = {}
    try {
      let unique = array
      let reviews = [];
      let listPrices = [];
      let starsReviews = [];
      let seeMoreUrls = [];
      let categories = []
      const promises = [];
      for (let url of unique) {
        //let promise = axiosCli.get(BASE_URL_MX + url);
      //   promises.push(promise);
      // }
      // Promise.allSettled(promises).then(function (responses) {
      //   for (let response of responses) {
          const response=await axios.getPromise(BASE_URL_MX + url)
          if(response&&response.data){
          let html = response.data;
          let $ = cheerio.load(html);
          let stars = $('#averageCustomerReviews .a-icon-star .a-icon-alt').text();
          let listPrice = $('#price_inside_buybox').text();
          let seeMore = $('#reviews-medley-footer .a-link-emphasis').attr('href');
          let reviewsNumber = $('#acrCustomerReviewText').text();
          let category = $('#wayfinding-breadcrumbs_feature_div li span').text();
          category = category.replace(/  +/g, ' ')
          category = category.replace(/\n/g, '').trim()
          console.log("category: ", category);
          let formatStars = stars.trim().split(" ")[0];
          let formatReviews = reviewsNumber.trim().split(" ")[0];
          console.log("format reviews: ", formatReviews);
          listPrices.push(listPrice);
          starsReviews.push(formatStars);
          reviews.push(formatReviews);
          seeMoreUrls.push(seeMore);
          categories.push(category);
          }
        }
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
            reviews: reviews[x],
            categories: categories[x]
          }
          shopItems.push(item);
        }

        const fields = ['url', 'price', 'stars', 'commentsurl', 'reviews', "categories"];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(shopItems);
        fs.writeFile(`${fileLoc}/links.csv`, csv, function (err) {
          if (err) throw err;
          console.log("SAVED CSV DATA!");
        });
      
      //})
    } catch (e) {
      console.error(`[getArticleData][error]:${e}`)
      response.error = e
    }
  }
  async getArticleReviews(fileLoc) {
    try {
      const jsonArray = await csvtojson().fromFile(`${fileLoc}/links.csv`);
      const newDataArray = [];
      const learnDataArray = [];
      const articleDataArray = [];

      let fasttext = "";
      for await (let item of jsonArray) {
        if (item.commentsurl.trim() == '') continue;
        try {

          const response = await axios.getPromise(BASE_URL_MX + item.commentsurl)
          //.then(async function (response) {
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
            reviews: item.reviews,
            categories: item.categories
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
              label: labels[x],
              categories: item.categories
            }
            learnDataArray.push({
              label: labels[x],
              title: titles[x],
              review: reviewsArticle[x]
            });
            newDataArray.push(jsonData);


          }
        } catch (e) {
          console.log("error");
        }
      }

      const fields = ['url', 'price', 'stars', 'review', 'generalrating', 'commentrating', 'label', 'title', "categories"];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(newDataArray);
      fs.writeFile(`${fileLoc}/reviews_data.csv`, csv, function (err) {
        if (err) throw err;
        console.log("SAVED CSV DATA!");
      });
      const fields2 = ['label', 'title', 'review'];
      const opts2 = { fields2 };
      const parser2 = new Parser(opts2);
      const csv2 = parser2.parse(learnDataArray);
      fs.writeFile(`${fileLoc}/model_data.csv`, csv2, function (err) {
        if (err) throw err;
        console.log("SAVED CSV DATA!");
      });
      fs.writeFile(`${fileLoc}/training.ft.txt`, fasttext, function (err) {
        if (err) throw err;
        console.log("SAVED FAST TEXT DATA!");
      });
      const fields3 = ['url', 'price', 'reviews', 'stars', 'comments', 'categories'];
      const opts3 = { fields3 };
      const parser3 = new Parser(opts3);
      const csv3 = parser3.parse(articleDataArray);
      fs.writeFile(`${fileLoc}/articles_data.csv`, csv3, function (err) {
        if (err) throw err;
        console.log("SAVED CSV DATA!");
      });
    } catch (e) {
      console.error(`[getArticleReviews][error]:${e}`)
      //response.error = e
    }
  }

  async scrapAmazonWishlist(publicId, folder) {
    const response = {}
    try {
      const start_url = `/hz/wishlist/ls/${publicId}`;
      const fileLoc = `${SCRAP_ROUTE}${folder}`
      await this.getWishlistArticles(start_url, fileLoc)
      await this.getArticleData(fileLoc)
      await this.getArticleReviews(fileLoc)
      return response
    } catch (e) {
      console.error(`[scrapAmazonWishlist][error]:${e}`)
      response.error = e
      return response
    }
  }

  async getViewed() {
    const fileLoc = `${SCRAP_ROUTE}/Viewed`
    var self = this
    await this.getArticleData(fileLoc)
    await this.getArticleReviews(fileLoc)
  }

  async scrapArticlesLinks(links, folder) {
    const fileLoc = `${SCRAP_ROUTE}${folder}`
    var response = {};
    await this.extractLinksData(links, fileLoc)
    await this.getArticleReviews(fileLoc)
  }
  async readFile(filename) {
    const fileArray = [];
    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream(filename)
    });
    for await (const line of lineReader) {
      console.log(line);
      fileArray.push(line);
    }
    return fileArray;
  }

}

module.exports = AmazonWishList;