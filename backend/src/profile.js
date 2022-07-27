'use strict';

// this is profile.js which contains all user profile
// information except passwords which is in auth.js
const parseFD = require('./uploadCloudinary')
const Profile = require('./model.js').Profile

const getHeadlines = (req, res) => {
    const users = req.params.users ? req.params.users.split(',') : [req.username]
    Profile.find({username: {$in: users}}).exec(function(err, profiles){
        let headlines = []
        if (!profiles || profiles.length === 0){
            res.status(500).send("none of these users exist in the db or you didn't supply at all")
            return
        }
        profiles.forEach(item => {headlines.push({username: item.username, headline: item.headline})})
        res.status(200).send({headlines:headlines})
    })
}

const putHeadline = (req, res) => {
    const user = req.username
    const headline = req.body.headline
    if (!headline) {
        res.status(400).send('you did not supply headline')
    }
    Profile.update({username: user}, { $set: { headline: headline }}, { new: true }, function(err, profile){
        res.status(200).send({username: user, headline: headline});
    })
}

const getEmail = (req, res) => {
    const username = req.params.user ? req.params.user : req.username
    Profile.find({username: username}).exec(function(err, profile){
        if(!profile || profile.length === 0){
            res.status(500).send("this user doesn't exist in the db")
            return
        }
        const profileObj = profile[0]
        res.status(200).send({username: username, email: profile[0].email})
    })
}

const putEmail = (req,res) => {
    const username = req.username
    const email = req.body.email
    if (!email) {
        res.status(400).send('you did not supply email')
    }
    Profile.update({username: username}, { $set: { email: email }}, { new: true }, function(err, profile){
        res.status(200).send({username: username, email: email});
    })
}

const getZipcode = (req, res) => {
    const username = req.params.user ? req.params.user : req.username
    Profile.find({username: username}).exec(function(err, profile){
        if(!profile || profile.length === 0){
            res.status(500).send("this user doesn't exist in the db")
            return
        }
        const profileObj = profile[0]
        res.status(200).send({username: username, zipcode: profile[0].zipcode})
    })
}

const putZipcode = (req,res) => {
    const username = req.username
    const zipcode = req.body.zipcode
    if (!zipcode) {
        res.status(400).send('you did not supply zipcode')
    }
    Profile.update({username: username}, { $set: { zipcode: zipcode }}, { new: true }, function(err, profile){
        res.status(200).send({username: username, zipcode: zipcode});
    })
}

const getAvatars = (req, res) => {
    const users = req.params.users ? req.params.users.split(',') : [req.username]
    Profile.find({username: {$in: users}}).exec(function(err, profiles){
        let avatars = []
        if (!profiles || profiles.length === 0){
            res.status(400).send("none of these users exist in the db or you didn't supply at all")
            return
        }
        profiles.forEach(item => {avatars.push({username: item.username, avatar: item.avatar})})
        res.status(200).send({avatars:avatars})
    })
}

const putAvatar = (req,res) => {
    const username = req.username
    const avatar = req.fileurl
    if (!avatar) {
        res.status(400).send('you did not supply avatar')
    }
    Profile.update({username: username}, { $set: { avatar: avatar }}, { new: true }, function(err, profile){
        res.status(200).send({username: username, avatar: avatar});
    })

}

const getDob = (req, res) => {

    const username = req.username;

    Profile.find({username: username}).exec(function(err, profile){
        const profileObj = profile[0]
        res.status(200).send({username: username, dob: profileObj.dob})
    })
}

module.exports = app => {
    app.get('/headlines/:users?', getHeadlines)
    app.put('/headline', putHeadline)

    app.get('/email/:user?', getEmail)
    app.put('/email', putEmail)

    app.get('/zipcode/:user?', getZipcode)
    app.put('/zipcode', putZipcode)

    app.get('/avatars/:users?', getAvatars)
    app.put('/avatar', parseFD('avatar'), putAvatar)

    app.get('/dob', getDob)
}

// "use strict"
// //profile realization
// const Profile = require('./model.js').Profile
//
// const getUserName = (req, res) => {
//     let username = req.username
//
//     Profile.find({username: username}).exec(function(err, profiles){
//         if(err){
//             return console.log(err)
//         }
//         if(!profiles || profiles.length == 0){
//             res.status(400).send({Msg: "No matching user found!"})
//             return
//         }
//         const profile = profiles[0]
//         res.status(200).send({username: username})
//         return
//     })
// }
//
//
//
// const getHeadline = (req, res) => {
//     let username = req.params.user
//     if(!username){
//         username = req.username
//     }
//     Profile.find({username: username}).exec(function(err, profiles){
//         if(err){
//             return console.log(err)
//         }
//         if(!profiles || profiles.length == 0){
//             res.status(400).send({Msg: "No matching user found!"})
//             return
//         }
//         const profile = profiles[0]
//         res.status(200).send({username: username, headline: profile.headline})
//         return
//     })
// }
//
//
//
// const updateHeadline = (req, res) => {
//     const username = req.username
//     const headline = req.body.headline
//     if(!username){
//         res.status(400).send("No username given")
//         return
//     }
//     if(!headline){
//         res.status(400).send("Please provide a headline")
//         return
//     }
//
//     Profile.updateOne({username: username}, {$set: {headline: headline}}, function(err, profile){
//         if(err){
//             res.status(400).send(err)
//             return
//         }
//         res.status(200).send({username: username, headline: headline})
//         return
//     })
// }
//
//
// const getAvatar = (req, res) => {
//     let username = req.params.user
//     if(!username){
//         username = req.username
//     }
//     Profile.find({username: username}).exec(function(err, profiles){
//         if(err){
//             return console.log(err)
//         }
//         if(!profiles || profiles.length == 0){
//             res.status(400).send({Msg: "No matching user found!"})
//             return
//         }
//         const profile = profiles[0]
//         res.status(200).send({username: username, avatar: profile.avatar})
//         return
//     })
// }
//
//
// const updateAvatar = (req, res) => {
//     const username = req.username
//     const avatar = req.body.avatar
//     if(!username){
//         res.status(400).send("No username given!")
//         return
//     }
//     if(!avatar){
//         res.status(400).send("Please provide a avatar!")
//         return
//     }
//
//     Profile.updateOne({username: username}, {$set: {avatar: avatar}}, function(err, profile){
//         if(err){
//             res.status(400).send(err)
//             return
//         }
//         res.status(200).send({username: username, avatar: avatar})
//         return
//     })
// }
//
//
// const getEmail = (req, res) => {
//     let username
//     if(!req.params.user){
//         username = req.username
//     }else{
//         username = req.params.user
//     }
//
//     Profile.find({username: username}).exec(function(err, profiles){
//         if(err){
//             return console.log(err)
//         }
//         if(!profiles || profiles.length == 0){
//             res.status(400).send({Msg: "No user found!"})
//             return
//         }
//         const profile = profiles[0]
//         res.status(200).send({username: username, email: profile.email})
//         return
//     })
// }
//
// const updateEmail = (req, res) => {
//     let username
//     if(!req.params.user){
//         username = req.username
//     }else{
//         username = req.params.user
//     }
//     let email = req.body.email
//     if(!email){
//         res.status(400).send("You need to provide an email!")
//         return
//     }
//     Profile.updateOne({username: username}, {$set: {email: email}}, function(err, profile){
//         if(err){
//             res.status(400).send(err)
//             return
//         }
//         res.status(200).send({username: username, email: email})
//         return
//     })
//
// }
//
//
// const getZipcode = (req, res) => {
//     let username
//     if(!req.params.user){
//         username = req.username
//     }else{
//         username = req.params.user
//     }
//
//     Profile.find({username: username}).exec(function(err, profiles){
//         if(err){
//             return console.log(err)
//         }
//         if(!profiles || profiles.length == 0){
//             res.status(400).send({Msg: "No matching user found"})
//             return
//         }
//         const profile = profiles[0]
//         res.status(200).send({username: username, zipcode: profile.zipcode})
//         return
//     })
// }
//
// const updateZipcode = (req, res) => {
//     let zipcode = req.body.zipcode
//     let username = req.username
//     if(!zipcode){
//         res.status(400).send("You need to provide a zipcode!")
//         return
//     }
//     Profile.updateOne({username: username}, {$set: {zipcode: zipcode}}, function(err, profile){
//         if(err){
//             res.status(400).send(err)
//             return
//         }
//         res.status(200).send({username: username, zipcode: zipcode})
//         return
//     })
// }
//
//
// const getDob = (req, res) => {
//     let username
//     if(!req.params.user){
//         username = req.username
//     }else{
//         username = req.params.user
//     }
//
//     Profile.find({username: username}).exec(function(err, profiles){
//         if(err){
//             return console.log(err)
//         }
//         if(!profiles || profiles.length == 0){
//             res.status(400).send({Msg: "No matching user found!"})
//             return
//         }
//         const profile = profiles[0]
//         res.status(200).send({username: username, dob: profile.dob})
//         return
//     })
// }
//
// module.exports = (app) => {
//     app.get("/username", getUserName)
//     app.get("/headline/:user?", getHeadline)
//     app.put("/headline", updateHeadline)
//     app.get("/avatar/:user?", getAvatar)
//     app.put("/avatar", updateAvatar)
//     app.get("/email/:user?", getEmail)
//     app.put("/email", updateEmail)
//     app.get("/zipcode/:user?", getZipcode)
//     app.put("/zipcode", updateZipcode)
//     app.get("/dob/:user?", getDob)
// }
