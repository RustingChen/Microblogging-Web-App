'use strict'
// this is model.js
var mongoose = require('mongoose')
require('./db.js')

var commentSchema = new mongoose.Schema({
    commentId: String,
    date: Date,
    text: String,
    avatar: String,
    author: String
})

var articleSchema = new mongoose.Schema({
    author: String,
    img: String,
    date: Date,
    text: String,
    comments: [ commentSchema ]
})

var userSchema = new mongoose.Schema({
    username: String,
    salt: String,
    hash: String,
    auth: [],
    authId: String
})

var profileSchema = new mongoose.Schema({
    username: String,
    headline: String,
    following: [ String ],
    dob: String,
    email: String,
    zipcode: String,
    avatar: String
})

exports.Article = mongoose.model('articles', articleSchema)
exports.User = mongoose.model('users', userSchema)
exports.Profile = mongoose.model('profiles', profileSchema)
exports.Comment = mongoose.model('comments', commentSchema)

// //database schema
// var mongoose = require('mongoose')
// require('./db.js')
//
// var userSchema = new mongoose.Schema({
//     username: String,
//     salt: String,
//     hash: String
// })
//
// var profileSchema = new mongoose.Schema({
//     username: String,
//     headline: String,
//     following: [ String ],
//     email: String,
//     dob: String,
//     zipcode: String,
//     avatar: String
// })
//
// var commentSchema = new mongoose.Schema({
//     commentId: String,
//     author: String,
//     text: String,
// })
//
// var articleSchema = new mongoose.Schema({
//     author: String,
//     body: String,
//     date: Date,
//     picture: String,
//     comments: [commentSchema]
// })
//
// exports.User = mongoose.model('user', userSchema)
// exports.Profile = mongoose.model('profile', profileSchema)
// exports.Comment = mongoose.model('comment', commentSchema)
// exports.Article = mongoose.model('article', articleSchema)
