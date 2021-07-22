const express = require('express')
const app = express()
const AxiosRequest = require('./axios-request');
const AmazonWishList = require('./amazon-wl-parser');
//const PUBLIC_ID = 'JQK192QOJWAT';//wishlist
//const PUBLIC_ID = '1SC1VTTG1NF8Y';//orders
//const PUBLIC_ID = '2DHLBBQ3H4MZ5';//RANDOM STUFF
//const PUBLIC_ID='243JW7M9J5CM7';//friend 1
//const PUBLIC_ID='1Q5QNY5MBS6H0';//friend 2
//const PUBLIC_ID='1VB5EHGPH80MT'; //SAID 1
//const PUBLIC_ID='330V0S4EUR5IU';//SAID 2
//const PUBLIC_ID='48KAR1FZYNVN';//SAID 3
const PUBLIC_ID = '2M2MYU2HGS5YM';//SAID 4
/**
 * req:{
 * public_id
 * }
 */
app.get('/scrap_wishlist', async function (req, res) {
    const ScrapFolders = {
        FRIENDS: '/Friends',
        ORDERS: '/Order_history',
        WISHLIST: '/Wishlist',
        OTHERS: '/Others'
    }
    let public_id = PUBLIC_ID
    let folder = ScrapFolders.OTHERS
    if (req.query.publicId)
        public_id = req.query.publicId
    if (req.query.folder) {
        switch (req.query.folder) {
            case 'friends':
                folder = ScrapFolders.FRIENDS
                break
            case 'orders':
                folder = ScrapFolders.ORDERS
                break
            case 'wishlist':
                folder = ScrapFolders.WISHLIST
                break
            case 'others':
                folder = ScrapFolders.OTHERS
                break
            default:
                folder = ScrapFolders.OTHERS
        }
    }
    console.log(`folder: ${folder} - public_id: ${public_id}`)
    const amazonScrap = new AmazonWishList()
    amazonScrap.scrapAmazonWishlist(public_id, folder).then(function (response) {
        res.send(response)
    })

})

app.get('/viewed_articles',async function(req,res){
    const amazonScrap = new AmazonWishList()
    await amazonScrap.getViewed().then(function(){
        res.send('finished')
    })
})

app.get('/scrap_urls', async function (req, res) {
    const ScrapFolders = {
        FRIENDS: '/Friends',
        ORDERS: '/Order_history',
        WISHLIST: '/Wishlist',
        OTHERS: '/Others',
        URLS: '/Urls'
    }
    let urls = []
    let folder = ScrapFolders.OTHERS
    let req_urls=req.query.urls
    let req_folder=req.query.folder
    if (req_urls)
        urls = req.query.urls
    if (req_folder) {
        switch (req_folder) {
            case 'friends':
                folder = ScrapFolders.FRIENDS
                break
            case 'orders':
                folder = ScrapFolders.ORDERS
                break
            case 'wishlist':
                folder = ScrapFolders.WISHLIST
                break
            case 'others':
                folder = ScrapFolders.OTHERS
                break
            case 'urls':
                folder = ScrapFolders.URLS
                break
            default:
                folder = ScrapFolders.OTHERS
        }
    }
    console.log(`folder: ${folder} - urls: ${urls}`)
    const amazonScrap = new AmazonWishList()
    amazonScrap.scrapArticlesLinks(urls, folder).then(function (response) {
        res.send(response)
    })

})

app.listen(3000)
console.log("API LISTENING ON PORT 3000")