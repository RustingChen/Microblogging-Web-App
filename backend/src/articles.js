'use strict';
//this is the stub for article
const Profile = require('./model.js').Profile
const Article = require('./model.js').Article
const User = require('./model.js').User
const Comment = require('./model.js').Comment
const ObjectId = require('mongoose').Types.ObjectId;
const md5 = require('md5')
const parseFD = require('./uploadCloudinary')

const getArticle = (req, res) => {
    if(req.params.id) {
        Article.find(ObjectId(req.params.id)).exec(function(err, articles){
            if (!articles || articles.length === 0){
                User.findOne(ObjectId(req.params.id)).exec(function(err, user) {
                    if(!user || user.length === 0){
                        res.status(401).send("Don't have this article ID or user ID")
                    } else {
                        Article.find({author: user.username}).exec(function(err, articles){
                            res.status(200).send({articles: articles})
                            return
                        })
                    }
                })
            } else {
                const articlesObj = articles[0]
                res.status(200).send({articles: articlesObj})
            }
        })}
    else{
        // Article.find({}).exec(function(err, articles){
        // res.status(200).send({articles: articles})
        const username = req.username;
        Profile.find({username: username}).exec(function(err, profile){
            const profileObj = profile[0]
            const usersToQuery = [username, ...profileObj.following]
            Article.find({author: {$in: usersToQuery}}).limit( 10 ).sort('-date').exec(function(err, articles){
                res.status(200).send({articles: articles})
            })
        })
    }
}

const updateArticle = (req, res) => {
    if (!req.params.id) {
        res.status(400).send('invalid ID!')
    } else {
        Article.find(ObjectId(req.params.id)).exec(function(err, articles){
            if (!articles || articles.length === 0) {
                res.status(401).send("Don't have this article ID")
                return
            } else if(req.body.commentId === "-1") {
                //add comment
                const commentId = md5(req.username + new Date().getTime())
                const commentObj = new Comment({commentId: commentId, author: req.username, date: new Date(), text: req.body.text})
                new Comment(commentObj).save(function (err, comments){
                    if(err) return console.log(err)
                })
                Article.findByIdAndUpdate(req.params.id, { $addToSet: {comments: commentObj}}, {upsert: true, new: true},  function(err, articles){})
                Article.find(ObjectId(req.params.id)).exec(function(err, articles){
                    res.status(200).send({articles: articles})
                })
            } else if(req.body.commentId){
                //update comment
                Comment.find({commentId: req.body.commentId}).exec(function(err, comments){
                    if (!comments || comments.length === 0) {
                        res.status(401).send("Don't have this comment ID")
                        return
                    }else if(comments[0].author !== req.username) {
                        res.status(401).send("you don't own this comment")
                        return
                    }else {
                        Comment.update({commentId: req.body.commentId}, { $set: { text: req.body.text }}, { new: true }, function(err, comments){})
                        Article.update({_id: req.params.id, 'comments.commentId': req.body.commentId}, { $set: { 'comments.$.text': req.body.text }}, { new: true }, function(err, articles){})
                        Article.find(ObjectId(req.params.id)).exec(function(err, articles){
                            res.status(200).send({articles: articles})
                        })
                    }
                })
            } else{
                if (articles[0].author !== req.username) {
                    //forbidden if this user dosen't own this article
                    res.status(401).send("you don't own this article")
                    return
                }
                //update articles
                Article.findByIdAndUpdate(req.params.id, { $set: { text: req.body.text }}, { new: true }, function(err, articles){
                    res.status(200).send({articles: articles});
                })
            }
        })

    }

}

const postArticle = (req, res) => {
    const articleObj = new Article({text: req.content, author: req.username, img:req.fileurl, date:new Date(), comments:[]})
    new Article(articleObj).save(function (err, articles){
        if(err) return console.log(err)
        res.status(200).send({articles: [articles]})
    })
}


module.exports = (app) => {
    app.get('/articles/:id?', getArticle)
    app.put('/articles/:id', updateArticle)
    app.post('/article', parseFD('img'), postArticle)
}


// //articles get and update realization
// "use strict"
// const Article = require('./model.js').Article
// const User = require('./model.js').User
// const Profile = require('./model.js').Profile
// var objectId = require('mongodb').ObjectID
// var mongoose = require('mongoose')
// // Stub articles
// const articles = [{id:1, author: "testUser", body: "hello world1", comment:[], picture:"",date: new Date()},
//                  {id:2, author: "testUser", body: "hello world world1", comment:[], picture:"",date: new Date()},
//                  {id:3, author: "value1", body: "world hello hello!", comment:[], picture:"",date: new Date()}]
//
// const updateArticle = (req, res) => {
//     let id = req.params.id
//     if(!id){
//         res.status(400).send("Invalid id!")
//     }else{
//         articles.filter(article => {
//             if(article.id == id){
//                 article.body = req.body.text
//             }
//         })
//         res.status(200).send(articles)
//     }
// }
//
// const postArticle = (req, res) => {
//     const username = req.username
//     const text = req.body.text
//     const comments=req.body.comments
//     if(!text){
//         res.status(400).send("No text found!")
//     }
//
//     new Article({ author: username, body:  text, date: new Date(), picture: "", comments: comments}).save(function (err, article) {
//         if (err) {
//             res.status(400).send(err)
//             return
//         }
//         res.status(200).send({articles: [article]})
//         return
//     })
// }
//
//
// //get the articles
// const getArticles = (req, res) => {
//     // const articleIdorUsername = req.params.id            //get the parameter
//     let articleId
//     let username
//     if(req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)){
//         articleId = req.params.id
//     }else if(req.params.id){
//         username = req.params.id
//     }
//
//     if(articleId){
//         Article.find({"_id": objectId(articleId)}).exec(function(err, articles){
//             if(err){
//                 res.status(400).send(err)
//                 return
//             }
//             if(articles){
//                 res.status(200).send({articles: articles})
//                 return
//             }else{
//                 res.status(400).send("There is no matching article")
//             }
//         })
//     }else if(username){
//         Article.find({author: username}).exec(function(err, articles){
//             if(err){
//                 res.status(400).send(err)
//                 return
//             }
//             res.status(200).send({articles: articles})
//         })
//     }else{
//         const username = req.username
//         if(!username){
//             res.status(400).send("There is no logged-in user")
//         }
//         Profile.find({username: username}).exec(function(err, profiles){
//             if(err){
//                 res.status(400).send(err)
//                 return
//             }
//             if(!profiles || profiles.length == 0){
//                 res.status(400).send("Didn't find matching profile")
//                 return
//             }
//             const profileObj = profiles[0]
//             const allUsers = [username, ...profileObj.following]
//             Article.find({author: {$in: allUsers}}).sort({date: -1}).exec(function(err, articles){
//                 if(err){
//                     res.status(400).send(err)
//                     return
//                 }
//                 res.status(200).send({articles: articles})
//             })
//         })
//
//     }
// }
//
//
// module.exports = (app) => {
//     app.post("/article", postArticle)
//     app.get("/articles/:id?", getArticles)
//     app.put("/articles/:id", updateArticle)
// }
//
//
