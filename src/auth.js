'use strict';
//this is the stub for authentication
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const md5 = require('md5')
const cookieKey = 'sid'
const User = require('./model.js').User
const Profile = require('./model.js').Profile
const Article = require('./model.js').Article
const Comment = require('./model.js').Comment
const request = require('request')
const session = require('express-session')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const secret = 'wwwwwwwwwwwwwwwwwww!'
const redis = require('redis').createClient('redis://:p30c6a1c9c37f808d4343f9b0adefcaf373e7b8ebe64e02ff8eba59d442626ee7@ec2-52-21-75-239.compute-1.amazonaws.com:29379')

let originHostUrl = '';

// const configGoogleAuth = {
//     clientID:'608314613229-780g9bpvsq656ppdqqvs9u2gdm66vhp2.apps.googleusercontent.com',
//     clientSecret:'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',
//     callbackURL: 'https://wmywebapphello.herokuapp.com/auth/google/callback',
//     passReqToCallback: true
// }

const register = (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const dob = req.body.dob;
    const zipcode = req.body.zipcode;
    const password = req.body.password;
    console.log(username,email,dob,zipcode,password)
    if (!username || !email || !dob || !zipcode || !password) {
        res.status(400).send({result: "all fields should be supplied"})
        return
    }
    //check if the username has already been used
    User.find({username: username}).exec(function(err, users){
        if(users.length !== 0) {
            res.status(400).send(`${username} has already been registered.`)
            return
        } else {
            const salt = md5(username + new Date().getTime())
            const hash = md5(password + salt)
            const userObj = new User({username: username, salt: salt, hash: hash, auth:[]})
            new User(userObj).save(function (err, usr){
                if(err) return console.log(err)
            })
            const profileObj = new Profile({username: username, headline: "", following:[], email: email, zipcode: zipcode, dob: dob, avatar: "http://staff.rice.edu/images/styleguide/Rice_OwlBlueTMCMYK300DPI.jpg"})
            new Profile(profileObj).save(function (err, usr){
                if(err) return console.log(err)
            })
            //successfully register
            res.send({
                username: username,
                result: 'success'
            })
        }
    })

}

const login = (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
        res.status(400).send("username or password is missing")
        return
    }

    User.find({username: username}).exec(function(err, users){
        if (!users || users.length === 0){
            res.sendStatus(400)
            return
        }
        const userObj = users[0]
        if(!userObj){
            res.status(400).send("Don't have this user in db")
        }
        const salt = userObj.salt;
        const hash = userObj.hash;

        if(md5(password + salt) === hash){
            const sessionKey = md5(secret + new Date().getTime() + userObj.username)
            redis.hmset(sessionKey, userObj)
            res.cookie(cookieKey, sessionKey, {maxAge: 3600*1000, httpOnly: true,sameSite:'none',secure:true})

            res.send({ username: username, result: 'success'})
        } else{
            res.status(401).send("incorrect password!")
        }
    })
}
//use merge to link all
const merge = (req, res) => {
    const username = req.body.regUsername;
    const password = req.body.regPassword;
    if (!username || !password) {
        res.status(400).send("username or password is missing")
        return
    }
    User.find({username: username}).exec(function(err, users){
        if (!users || users.length === 0){
            res.sendStatus(400)
            return
        }
        const userObj = users[0]
        if(!userObj){
            res.status(400).send("Don't have this user in db")
        }
        const salt = userObj.salt;
        const hash = userObj.hash;

        if(md5(password + salt) === hash){
            //third party username
            Article.update({author:req.username}, { $set: { 'author': username}}, { new: true, multi: true}, function(){})
            Article.update({'comments.author' : req.username}, { $set: {'comments.$.author': username}}, { new: true, multi: true }, function(){})
            Comment.update({author:req.username}, { $set: { 'author': username}}, { new: true, multi: true }, function(){})
            Profile.findOne({username: req.username}).exec(function(err, profile){
                if(profile){
                    const oldFollowingArr = profile.following
                    Profile.findOne({username: username}).exec(function(err, newProfile) {
                        if(newProfile){
                            //concat
                            const newFollowingArr = newProfile.following.concat(oldFollowingArr)
                            Profile.update({username: username}, {$set: {'following': newFollowingArr}}, function(){})
                        }
                    })
                    //delete the profile record
                    Profile.update({username: req.username}, {$set: {'following':[]}}, function(){})
                }
            })
            User.findOne({username: username}).exec(function(err, user){
                if(user){
                    const usrArr = req.username.split('@');
                    const authObj = {}
                    authObj[`${usrArr[1]}`] = usrArr[0]
                    User.update({username: username}, {$addToSet: {'auth': authObj}}, {new: true}, function(){})
                }
            })
            res.status(200).send({ username: username, result: 'success'})
        } else{
            res.status(401).send("incorrect password!")
        }
    })
}

const unlink = (req, res) => {
    const username = req.username
    const company = req.body.company
    User.findOne({username: username}).exec(function(err, user){
        if(user.auth.length !== 0){
            User.findOne({username: username}).exec(function(err,user){
                let authArr = user.auth
                authArr = authArr.filter(function (obj) {
                    return Object.keys(obj)[0] !== company;
                })
                User.update({username: username}, {$set: {'auth': authArr}}, {new: true}, function(){})
                res.status(200).send({result: 'successfully unlink ' + company})
            })
        } else {
            res.status(400).send("no link account")
        }
    })
}

//wait for the final requirement
const newPassword = (req, res) => {
    const newPassword = req.body.password;
    const username = req.username;
    if (!newPassword) {
        res.status(400).send("newPassword is missing")
        return
    }
    User.find({username: username}).exec(function(err, users){
        const userObj = users[0]
        const oldSalt = userObj.salt;
        const oldHash = userObj.hash;
        if(md5(newPassword + oldSalt) === oldHash){
            res.status(400).send({username: username, status: 'you have used the same password'})
        }
        else{
            const newSalt = md5(username + new Date().getTime())
            const newHash = md5(newPassword + newSalt)
            User.update({username: username}, { $set: { salt: newSalt, hash: newHash }}, { new: true }, function(err, profile){
                if(err) return console.log(err)
                res.status(200).send({username: username, status: 'successfully change the password and you can logout to check'})
            })
        }
    })
}


//use Google Strategy to login

// passport.use(new GoogleStrategy(configGoogleAuth,
//     function(req, token, refreshToken, profile, done){
//         const username = profile.displayName + "@" + profile.provider
//         //check if there is a login user
//         const sid = req.cookies[cookieKey]
//         if(!sid){
//             User.findOne({username: username}).exec(function(err, user) {
//                 if(!user || user.length === 0){
//                     const userObj = new User({username: username, authId: profile.id})
//                     new User(userObj).save(function (err, usr){
//                         if(err) return console.log(err)
//                     })
//                     const profileObj = new Profile({username: username, headline: "login by google", following:[], email: null, zipcode: null, dob: new Date(1999,09,09).getTime(), avatar: "http://talkingpointsmemo.com/images/google-android-mascot.jpg"})
//                     new Profile(profileObj).save(function (err, usr){
//                         if(err) return console.log(err)
//                     })
//                 }
//                 return done(null, profile)
//             })
//         } else {
//             //if there is a local login, link them
//             redis.hgetall(sid, function(err, userObj) {
//                 const localUser = userObj.username
//                 Article.update({author:username}, { $set: { 'author': localUser}}, { new: true, multi: true }, function(){})
//                 Article.update({'comments.author' : username}, { $set: {'comments.$.author': localUser}}, { new: true, multi: true }, function(){})
//                 Comment.update({author:username}, { $set: { 'author': localUser}}, { new: true, multi: true }, function(){})
//                 Profile.findOne({username: username}).exec(function(err, profileData){
//                     if(profileData){
//                         const oldFollowingArr = profileData.following
//                         Profile.findOne({username: localUser}).exec(function(err, newProfile) {
//                             if(newProfile){
//                                 //concat
//                                 const newFollowingArr = newProfile.following.concat(oldFollowingArr)
//                                 Profile.update({username: localUser}, {$set: {'following': newFollowingArr}}, function(){})
//                             }
//                         })
//                         //delete the profile record
//                         Profile.update({username: username}, {$set: {'following':[]}}, function(){})
//                     }
//                 })
//                 User.findOne({username: localUser}).exec(function(err, user){
//                     if(user){
//                         let authObj = {}
//                         authObj[`${profile.provider}`] = profile.displayName
//                         User.update({username: localUser}, {$addToSet: {'auth': authObj}}, {new: true}, function(){})
//                     }
//                 })
//             })
//             return done(null, profile)
//         }
//     }
// ))

// passport.serializeUser(function(user, done){
//     done(null, user.id)
// })
//
// passport.deserializeUser(function(id,done){
//     User.findOne({authId: id}).exec(function(err, user) {
//         done(null, user)
//     })
// })

function logout(req,res){
    //have bugs
    if (req.isAuthenticated()) {
        req.session.destroy()
        req.logout()
        //corner case for link acount
        if(req.cookies[cookieKey] !== undefined){
            const sid = req.cookies[cookieKey]
            redis.del(sid)
            res.clearCookie(cookieKey)
        }
        res.status(200).send("OK")
    } else if(req.cookies[cookieKey] !== null){
        const sid = req.cookies[cookieKey]
        redis.del(sid)
        res.clearCookie(cookieKey)
        res.status(200).send("OK")
    }
}

function isLoggedIn(req, res, next){
    check if third-party authenticated, if not, then check for our session+cookie
    if (req.isAuthenticated()) {
        const usrArr = req.user.username.split('@');
        const authObj = {}
        authObj[`${usrArr[1]}`] = usrArr[0]
        User.findOne({auth: authObj}).exec(function(err,user) {
            if(!user){
                req.username = req.user.username
            } else {
                req.username = user.username
            }
            next()
        })
    } else{
        const sid = req.cookies[cookieKey]

        console.log("sid="+sid)
       // console.log("cookie="+req.cookies[cookieKey])
        if (!sid){
            return res.sendStatus(401)
        }
        redis.hgetall(sid, function(err, userObj) {
            if(err) throw err;
            if(userObj){
                console.log(sid + ' mapped to ' + userObj.username)
                req.username = userObj.username
                console.log("789")
                next()
            }
            else{
                res.sendStatus(401)
            }
        })
    }

}

const successFun = (req,res) => {
    res.redirect(originHostUrl)
}

const errorFun = (err,req,res,next) => {
    if(err) {
        res.status(400);
        res.send({err: err.message});
    }
}

const locationFun = (req, res, next) => {
    if(originHostUrl === ''){
        originHostUrl = req.headers.referer
    }
    next()
}

module.exports = app => {
    app.use(cookieParser());

    app.use(locationFun)
    app.use(session({secret:'thisIsMySecretMessage', resave: false, saveUninitialized: false}))
    app.use(passport.initialize())
   app.use(passport.session())
   app.use('/login/google', passport.authenticate('google', {scope:'profile'}))
   app.use('/auth/google/callback', passport.authenticate('google', {failureRedirect:'/login/google'}), successFun, errorFun)
    app.post('/login', login);
    app.post('/register', register);

    app.use(isLoggedIn)
   app.use('/link/google', passport.authorize('google', {scope:'profile'}))

   app.post('/unlink', unlink)
   app.post('/merge', merge)
    app.put('/password', newPassword);
    app.put('/logout', logout);

}

// "use strict"
// //register,login and logout realization
// const cookieKey = 'sid'
// const sessionUser = new Map()
// const cookieParser = require('cookie-parser')
// const md5 = require('md5')
// const secret = "this is my secret"
// const User = require('./model.js').User
// const Profile = require('./model.js').Profile
//
// const register = (req, res) => {
//     const username = req.body.username
//     const email = req.body.email
//     const dob = req.body.dob
//     const zipcode = req.body.zipcode
//     const password = req.body.password
//
//     if (!username || !email || !dob || !zipcode || !password) {
//         res.status(400).send({Msg: "Missing information for register!"})
//         return
//     }
//
//     User.find({ username: username }).exec(function (err, users) {
//         if (err) {
//             res.status(400).send({Msg: err})
//             return
//         }
//         if (users.length > 0) {
//             res.status(400).send({Msg: "The username has been registered!"})
//             return
//         }
//         const salt = username + new Date().getTime()
//         const hash = md5(password + salt)
//
//         new User({ username: username, salt: salt, hash: hash }).save(function (err, user) {
//             if (err) {
//                 res.status(400).send({Msg: err})
//                 return
//             }
//         })
//
//         new Profile({ username: username, headline: "", following: [], email: email, dob: dob, zipcode: zipcode, avatar: "" }).save(function (err, profile) {
//             if (err) {
//                 res.status(400).send({Msg: err})
//                 return
//             }
//         })
//         res.status(200).send({ result: "success", username: username })
//         return
//     })
// }
//
//
//
// const login = (req, res) => {
//     const username = req.body.username
//     const password = req.body.password
//
//     if (!username || !password) {
//         res.status(400).send({Msg: "You need to provide username and password"})
//         return
//     }
//
//     User.find({ username: username }).exec(function (err, users) {
//         if (err) {
//             res.status(400).send({Msg: err})
//             return
//         }
//         if (!users || users.length == 0) {
//             res.status(400).send({Msg: "No user found!"})
//             return
//         }
//         const userObj = users[0]
//         const salt = userObj.salt
//         const hash = userObj.hash
//
//         if (md5(password + salt) === hash) {
//             const sessionKey = md5(secret + new Date().getTime() + userObj.username)
//             sessionUser.set(sessionKey, userObj)
//             res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true })
//             res.status(200).send({ username: username, result: "success" })
//         } else {
//             res.status(400).send({Msg: 'Password wrong!'})
//         }
//     })
// }
//
//
// const isLoggedIn = (req, res, next) => {
//     const sid = req.cookies[cookieKey]
//     if (!sid) {
//             return res.sendStatus(401)
//     }
//
//     const userObj = sessionUser.get(sid)
//     const username = userObj.username
//
//     if (username) {
//         req.username = username
//         next()
//     } else {
//         res.sendStatus(401)
//     }
// }
//
// const logout = (req, res) => {
//     const sid = req.cookies[cookieKey]
//     sessionUser.delete(sid)
//     res.clearCookie(cookieKey)
//     res.status(200).send("OK")
// }
//
// const updatePassword = (req, res) => {
//     const newPassword = req.body.password        //get the new password from the request
//     const sid = req.cookies[cookieKey]           //get the sid for the logged in user
//     const userObj = sessionUser.get(sid)
//     const username = userObj.username            //get the username of the logged in user
//
//     if(!newPassword){
//         res.status(400).send({Msg: "No password provided!"})
//         return
//     }
//
//     User.find({username: username}).exec(function(err, users){
//         if(err){
//             res.status(400).send({Msg: err})
//             return
//         }
//         if(users.length == 0){
//             res.status(400).send({Msg: "No user found"})
//             return
//         }
//
//         const newSalt = username + new Date().getTime()
//         const newHash = md5(newPassword + newSalt)
//
//         User.updateOne({username: username}, {$set: {salt: newSalt, hash: newHash}}, function(err, user){
//             if(err){
//                 res.status(400).send({Msg: err})
//                 return
//             }
//             res.status(200).send({username: username, result: "success"})
//             return
//         })
//     })
//
// }
//
//
//
//
// module.exports = (app) => {
//     app.use(cookieParser())
//     app.post("/register", register)
//     app.post("/login", login)
//     app.use(isLoggedIn)
//     app.put("/logout", logout)
//     app.put("/password", updatePassword)
// }
