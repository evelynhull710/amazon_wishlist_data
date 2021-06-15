const express = require('express')
const app = express()
const axios = require('axios');
const fs = require('fs');
// var AmazonWishList = require('amazon-wish-list');
// var awl = new AmazonWishList.default('JQK192QOJWAT');
 //https://github.com/stylesuxx/amazon-wish-list

//US WISHLIST ID: 3EGL33WZPAJ8Q
//MX WISHLIST ID: JQK192QOJWAT

//URL MX https://www.amazon.com.mx/hz/wishlist/ls/(YOUR PUBLIC ID)
//URL US https://www.amazon.com/hz/wishlist/ls/(YOUR PUBLIC ID)

//is just different in mx 

//let list= await awl.getItems();
app.get('/', function (req, res) {
   // Make a request for a user with a given ID
    axios.get('https://www.amazon.com/hz/wishlist/ls/3EGL33WZPAJ8Q')
    .then(function (response) {
        // handle success
        fs.writeFile("test.txt", JSON.stringify(response), function(err) {
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

// awl.getById('3EGL33WZPAJ8Q').then(function(list) {
//   console.log(list);
// });


app.listen(3000)
console.log("API LISTENING ON PORT 3000")