const Posts = require('../models/postModel');
const cloudinary = require('../middleware/cloudinary');
const Users = require('../models/userModel');

module.exports.createPost = async (req, res) => {
    try {
        const { title, content, images } = req.body;
        if (!images.fileUpload.length) {
            return res.status(400).json({ msg: 'No Images Uploaded' });
        }
        const newPost = new Posts({
            title,
            content,
            images: images.fileUpload,
            user: req.user._id,
        });
        images.fileUpload.forEach(async file => {
            const result = await cloudinary.uploader.upload(file, {
                folder: `users/${req.user.username}`,
                width: 300,
                crop: 'scale',
            })
                .catch((err) => {
                    return res.status(400).json({ msg: err.message });
                });;
        });
        await newPost.save();
        return res.status(200).json({
            msg: 'Post Created!!!',
            newPost,
        });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.getPosts = async (req, res) => {
    try {
        const posts = await Posts.find({ user: req.user._id });
        return res.status(200).json({ msg: 'Success', posts });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.fetchPost = async (req, res) => {
    try {
        const post = await Posts.findOne({ _id: req.params.post_id });
        if (!post) {
            return res.status(400).json({ msg: 'No post available' });
        }
        return res.status(200).json({ msg: 'Success', post });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.findFromPost = async (req, res) => {
    try {
        const post = await Posts.findOne({ _id: req.params.post_id });
        if (!post) {
            return res.status(400).json({ msg: 'No user available' });
        }
        const user = await Users.findById(post.user);
        return res.status(200).json({ msg: 'Success', user });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.likePost = async (req, res) => {
    try {
        const post = await Posts.findOne({ _id: req.params.post_id });
        if (!post) {
            return res.status(400).json({ msg: 'No post available' });
        }
        if (post.likes.includes(req.user._id)) {
            return res.status(400).json({ msg: 'You already liked this post' });
        }
        if (post.dislikes.includes(req.user._id)) {
            post.dislikes.pull(req.user._id);
        }
        post.likes.push(req.user._id);
        await post.save();
        return res.status(200).json({ length: post.likes.length, second: post.dislikes.length });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.dislikePost = async (req, res) => {
    try {
        const post = await Posts.findOne({ _id: req.params.post_id });
        if (!post) {
            return res.status(400).json({ msg: 'No post available' });
        }
        if (post.dislikes.includes(req.user._id)) {
            return res.status(400).json({ msg: 'You already disliked this post' });
        }
        if (post.likes.includes(req.user._id)) {
            post.likes.pull(req.user._id);
        }
        post.dislikes.push(req.user._id);
        await post.save();
        return res.status(200).json({ length: post.dislikes.length, second: post.likes.length });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};