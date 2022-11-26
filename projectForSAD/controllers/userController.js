const Users = require('../models/userModel');
const EmailToken = require('../models/email_token');
const cloudinary = require('../middleware/cloudinary');

module.exports.searchUser = async (req, res) => {
    try {
        const users = await Users.find({ username: { $regex: req.query.username } })
            .limit(5)
            .select("fullname username avatar");
        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.getUser = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id).select("fullname story username email avatar followers following gender mobile address website");
        if (user) {
            return res.status(200).json(user);
        }
        return res.status(400).json({ msg: 'User not found' });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.follow = async (req, res) => {
    try {
        const { receiver } = req.body;
        const sender = req.user._id.toString();
        const checkUser = await Users.findById(sender);
        if (sender === receiver) {
            return res.status(400).json({ msg: "You can't follow yourself" });
        }
        if (checkUser.following.includes(receiver)) {
            const user = await Users.findByIdAndUpdate(sender, {
                $pull: {
                    following: receiver
                }
            });
            const rec_user = await Users.findByIdAndUpdate(receiver, {
                $pull: {
                    followers: sender
                }
            });
        }
        else {
            const user = await Users.findByIdAndUpdate(sender, {
                $push: {
                    following: receiver
                }
            });
            const rec_user = await Users.findByIdAndUpdate(receiver, {
                $push: {
                    followers: sender
                }
            });
        }
        return res.status(200).json({ msg: 'Success' });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.isFollowing = async (req, res) => {
    try {
        const { receiver, sender } = req.body;
        const user = await Users.findById(receiver);
        if (!user) {
            return res.status(400).json({ msg: 'No such user found (receiver)' });
        };
        if (user.followers?.includes(sender)) {
            return res.status(200).json(true);
        }
        return res.status(200).json(false);
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.setUser = async (req, res) => {
    try {
        const { fullname, mobile, gender, story, address, website, avatar } = req.body;
        var user = req.user;
        if (user.editChecker === 1) {
            return res.status(400).json({ msg: 'You cannot edit your profile' });
        }
        const result = await cloudinary.uploader.upload(avatar[0], {
            folder: `ProfileImages/${req.user.username}`,
            width: 300,
            crop: 'scale',
        })
            .catch((err) => {
            console.error(err);
        });
        user.fullname = fullname;
        user.mobile = mobile;
        user.gender = gender;
        user.story = story;
        user.address = address;
        user.website = website;
        user.editChecker = 1;
        user.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        };
        const _id = user._id;
        const data = await Users.findByIdAndUpdate(_id, user);
        return res.status(200).json({ data });
    }
    catch (err) {
        console.error(err)
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.getEditChecker = async (req, res) => {
    try {
        const user_id = req.user._id.toString();
        await Users.findByIdAndUpdate(user_id, { editChecker: 1 });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.getUserById = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id).select("username fullname avatar");
        return res.status(200).json({ user });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.emailVerification = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }
        const email_token = await EmailToken.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!email_token) {
            return res.status(400).json({ msg: 'Invalid Token' });
        }
        await Users.findByIdAndUpdate(user._id, {
            isConfirmed: true,
        });
        await email_token.remove();
        return res.status(200).json({ msg: 'Email verified successfully' });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};