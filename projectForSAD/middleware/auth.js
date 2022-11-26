const Users = require('../models/userModel');
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization");
        // return res.status(200).json({ msg: 'sdf' });
        if (!token) {
            return res.status(400).json({ msg: "Invalid authentication" });
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        if (!token) {
            return res.status(400).json({ msg: "Invalid authentication" });
        }
        const user = await Users.findOne({ _id: decoded.id });
        req.user = user;
        next();
    } catch (err) {
        console.log('sdfsdf')
        return res.status(500).json({ msg: err.message });
    }
};

module.exports = auth;