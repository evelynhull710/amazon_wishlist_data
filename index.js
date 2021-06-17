const express = require('express')
const app = express()
const axios = require('axios');
const fs = require('fs');
const AmazonWishList = require('./amazon-wl-parser');
const cheerio =require('cheerio');
// var AmazonWishList = require('amazon-wish-list');
// var awl = new AmazonWishList.default('JQK192QOJWAT');
 //https://github.com/stylesuxx/amazon-wish-list

//US WISHLIST ID: 3EGL33WZPAJ8Q
//MX WISHLIST ID: JQK192QOJWAT

//URL MX https://www.amazon.com.mx/hz/wishlist/ls/(YOUR PUBLIC ID)
//URL US https://www.amazon.com/hz/wishlist/ls/(YOUR PUBLIC ID)

//is just different in mx 

app.get('/wishlist', function (req, res) {
   // Make a request for a user with a given ID
    axios.get('https://www.amazon.com.mx/hz/wishlist/ls/JQK192QOJWAT',{
        scrollY:1000
      })
    .then(function (response) {
        console.log("response next: "+response.next);
        const html = response.data;
        const $ = cheerio.load(html);
        let title=$('#profile-list-name').text();
        let itemTitles=$('h3 .a-link-normal').text();
        let prices=$('.price-section').text();
        console.log(prices);
        const titles=[];
        itemTitles.split('\n').forEach(element => {
            if(element.trim()!='')
            titles.push(element);
        });
        console.log(titles);
        // handle success
        fs.writeFile("test.txt", $.text(), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
        
        console.log(response);
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
    .then(function () {
        // always executed
    });

    res.send('hello world')
})

app.get('/', function (req, res) {
    const htmlManager=new AmazonWishList();
    htmlManager.getById('3EGL33WZPAJ8Q').then(function(list) {
        console.log(list);
      });
     res.send('hello world')
 })

// awl.getById('3EGL33WZPAJ8Q').then(function(list) {
//   console.log(list);
// });


app.listen(3000)
console.log("API LISTENING ON PORT 3000")