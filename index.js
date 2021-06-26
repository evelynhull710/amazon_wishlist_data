const express = require('express')
const app = express()
const axios = require('axios');
const fs = require('fs');
const AmazonWishList = require('./amazon-wl-parser');
const cheerio =require('cheerio');
const jwt_decode = require('jwt-decode');

const BASE_URL_MX='https://www.amazon.com.mx';
const PUBLIC_ID='JQK192QOJWAT'
const START_URL_WL=`/hz/wishlist/ls/${PUBLIC_ID}`;
// var AmazonWishList = require('amazon-wish-list');
// var awl = new AmazonWishList.default('JQK192QOJWAT');
 //https://github.com/stylesuxx/amazon-wish-list

//US WISHLIST ID: 3EGL33WZPAJ8Q
//MX WISHLIST ID: JQK192QOJWAT

//URL MX https://www.amazon.com.mx/hz/wishlist/ls/(YOUR PUBLIC ID)
//URL US https://www.amazon.com/hz/wishlist/ls/(YOUR PUBLIC ID)

//is just different in mx 

app.get('/wishlist', async function (req, res) {
let nextPageUrl='';

    let response=await axios.get(BASE_URL_MX+START_URL_WL);
//showMoreUrl   <- input name that has next url
        let html = response.data;
        let $ = cheerio.load(html);
        let title=$('#profile-list-name').text();
        let itemTitles=$('h3 .a-link-normal').text();
        let urlValues=$('.showMoreUrl').val();;
        console.log(urlValues);
        let prices=[];
        let pageUrls=[];
        $('.price-section').text().split('\n').forEach(element=>{
            if(element.trim()!=''&&element.trim().startsWith('$')){
                prices.push(element.trim());
            }
        });
        
        console.log(prices);
        let titles=[];
        itemTitles.split('\n').forEach(element => {
            if(element.trim()!='')
            titles.push(element);
        });
        console.log(titles);
        // fs.writeFile('test.txt', titles.join('\n'), function (err) {
        //     if (err) throw err;
        //     console.log('Saved!');
        //   });
        let duplicated=false;
        while(!duplicated){
            nextPageUrl=urlValues;
            if(pageUrls.includes(nextPageUrl)){duplicated=true;break;}
            pageUrls.push(nextPageUrl);
            let response= await axios.get(BASE_URL_MX+nextPageUrl);
            html = response.data;
                $ = cheerio.load(html);
                title=$('#profile-list-name').text();
                itemTitles=$('h3 .a-link-normal').text();
                urlValues=$('.showMoreUrl').val();;
                console.log(urlValues);
                $('.price-section').text().split('\n').forEach(element=>{
                    if(element.trim()!=''&&element.trim().startsWith('$')){
                        prices.push(element.trim());
                    }
                });
                
                console.log(prices);
                itemTitles.split('\n').forEach(element => {
                    // if(titles.includes(element)){
                    //     duplicated=true;
                    // }
                    if(element.trim()!=''&&!duplicated)
                    titles.push(element);
                });
                console.log(titles);
                // fs.appendFile('test.txt', titles.join('\n'), function (err) {
                //     if (err) throw err;
                //     console.log('Saved!');
                //   });
             //NEED TO FIX 503     
            }
            console.log('got out from loop!');
            // const set = new Set(titles);
            // console.log('size:',set.size);
            // fs.writeFile('test.txt', [...set].join('\n'),function(err){
            //     if(err)throw err;
            //     console.log('saved!')
            // });
        
        //console.log(response);

    res.send('hello world')
})

app.get('/', function (req, res) {
    const htmlManager=new AmazonWishList();
    htmlManager.getById('3EGL33WZPAJ8Q').then(function(list) {
        console.log(list);
      });
     res.send('hello world')
 })



app.listen(3000)
console.log("API LISTENING ON PORT 3000")