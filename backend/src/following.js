// "use strict"
// //stub following data
// const followingList = [
//     {
//         username: "testUser",
//         friends: ["bc39", "value1"]
//     }
// ]
//
// let loggedInUser = "testUser"           //stub loggedInUser
//
// const getFriends = (req, res) => {
//     let userName = req.params.user
//     let userFound = false
//     followingList.filter(item => {
//         if(item.username == userName){
//             userFound = true
//             let toReturn = {username: userName, following: item.friends}
//             res.status(200).send(toReturn)
//             return
//         }
//     })
//     if(userFound == false){
//         res.status(404).send("No matching user found!")
//     }
// }
//
// const addFriend = (req, res) => {
//     let friendName = req.params.user
//     if(!friendName){
//         res.status(400).send("Please provide a username!")
//         return
//     }
//     followingList.filter(item => {
//         if(item.username == loggedInUser){
//             item.friends.push(friendName)
//             let toReturn = {username: loggedInUser, following: item.friends}
//             res.status(200).send(toReturn)
//             return
//             }
//         })
// }
//
// const deleteFriend = (req, res) => {
//     let friendName = req.params.user
//     if(!friendName){
//         res.status(400).send("Please provide a username!")
//         return
//     }
//     let friendExist = false
//     followingList.filter(item => {
//         if(item.username == loggedInUser){
//             let friendList = item.friends
//             let stillFriends = friendList.filter(friendNameLs => {
//                 if(friendNameLs != friendName){
//                     return friendNameLs
//                 }else{
//                     friendExist = true
//                 }
//             })
//
//             item.friends = stillFriends
//
//             let toReturn = {username: loggedInUser, following: item.friends}
//
//             if(friendExist == true){
//                 res.status(200).send(toReturn)
//                 return
//             }else{
//                 res.status(404).send("No follower found!")
//                 return
//             }
//
//
//             }
//         })
// }
//
//
// module.exports = (app) => {
//     app.get("/following/:user?", getFriends)
//     app.put("/following/:user", addFriend)
//     app.delete("/following/:user", deleteFriend)
// }
'use strict';
//this is the stub for following
const Profile = require('./model.js').Profile

const getFollowing = (req, res) => {
    const username = req.params.user ? req.params.user : req.username
    Profile.find({username: username}).exec(function(err, profile){
        if(!profile || profile.length === 0){
            res.status(400).send("this user doesn't exist in the db")
            return
        }
        const profileObj = profile[0]
        res.status(200).send({username: username, following: profileObj.following})
    })
}

const putFollowing = (req, res) => {
    const user = req.params.user
    const username = req.username
    if (!user) {
        res.status(400).send('you did not supply the user to follow')
    }
    Profile.find({username: user}).exec(function(err, profile){
        if(!profile || profile.length === 0) {
            res.status(400).send('you can not follow those who are not in db')
        } else {
            Profile.findOneAndUpdate({username: username}, { $addToSet: { following: user }}, {new: true}, function(err, profile){})
            Profile.find({username: username}).exec(function(err, profile){
                const profileObj = profile[0]
                res.status(200).send({username: username, following: profileObj.following})
            })
        }
    })
}

const deleteFollowing = (req, res) => {
    const user = req.params.user
    const username = req.username
    if (!user) {
        res.status(400).send('you did not supply the user to follow')
    }
    Profile.findOneAndUpdate({username: username}, { $pull: { following: user }}, {new: true }, function(err, profile){})
    Profile.find({username: username}).exec(function(err, profile){
        const profileObj = profile[0]
        res.status(200).send({username: username, following: profileObj.following})
    })
}

module.exports = app => {
    app.get('/following/:user?', getFollowing)
    app.put('/following/:user', putFollowing)
    app.delete('/following/:user', deleteFollowing)
}