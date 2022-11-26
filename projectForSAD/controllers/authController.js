const Users = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const EmailToken = require('../models/email_token');
const sendEmail = require('../middleware/sendEmail');
const crypto = require('crypto');

module.exports.register = async (req, res) => {
    try {
        const { fullname, username, email, gender, password } = req.body;
        if (!/^[a-zA-Z]([a-zA-Z0-9]{4,})+$/.test(username)) {
            return res.status(400).json({ msg: 'Invalid username or email address' });
        }
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(email)) {
            return res.status(400).json({ msg: 'Invalid username or email address' });
        }
        const check_username = await Users.findOne({ username });
        if (check_username) {
            return res.status(400).json({ msg: 'Username is already in use' });
        }
        const check_email = await Users.findOne({ email });
        if (check_email) {
            return res.status(400).json({ msg: 'Email address is already in use' });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Minimum password length is 6' });
        }
        let avatar = { public_id: '', url: '' };
        if (gender === 'female') {
            avatar.url = 'https://res.cloudinary.com/mern-stack/image/upload/v1668503017/ProfileImages/default/download_s4ipcs.png';
        }
        else {
            avatar.url = 'https://res.cloudinary.com/mern-stack/image/upload/v1668503151/ProfileImages/default/profile-default-male_tm30gq.jpg';
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const newUser = await Users.create({
            fullname,
            username,
            email,
            password: passwordHash,
            gender,
            avatar,
        });
        const access_token = createAccessToken({ id: newUser._id });
        const refresh_token = createRefreshToken({ id: newUser._id });
        res.cookie('refreshtoken', refresh_token, {
            httpOnly: true,
            path: '/api/auth/refresh_token',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        const email_token = await new EmailToken({
            userId: newUser._id,
            token: crypto.randomBytes(32).toString('hex')
        }).save();
        const url = `${process.env.BASE_URL}/users/${newUser._id}/verify/${email_token.token}`;
        await sendEmail(newUser.email, newUser.fullname, 'Email Verification Message', url);
        return res.status(201).json({
            msg: "Success, verify your email",
            access_token,
            user: {
                ...newUser._doc,
                password: ''
            }
        });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await Users.findOne({ email })
            .populate("followers following", "-password");
        if (!user) {
            user = await Users.findOne({ username: email })
                .populate("followers following", "-password");
            if (!user) {
                return res.status(400).json({ msg: 'Invalid email address or password' });
            }
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid email address or password' });
        }
        if (user.isConfirmed === false) {
            let email_token = await EmailToken.findOne({ userId: user._id });
            if (!email_token) {
                email_token = await new EmailToken({
                    userId: user._id,
                    token: crypto.randomBytes(32).toString('hex')
                }).save();
                const url = `${process.env.BASE_URL}/api/users/${user._id}/verify/${email_token.token}`;
                await sendEmail(user.email, user.fullname, 'Email Verification Message', url);
            }
            return res.status(400).json({ msg: 'Please confirm your email to login' });
        }
        const access_token = createAccessToken({ id: user._id });
        const refresh_token = createRefreshToken({ id: user._id });
        res.cookie('refreshtoken', refresh_token, {
            httpOnly: true,
            path: '/api/auth/refresh_token',
            maxAge: 30 * 24 * 60 * 60 * 1000 // equals 30 days
        });
        return res.status(200).json({
            msg: "Success",
            access_token,
            user: {
                ...user._doc,
                password: ''
            }
        });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.logout = async (req, res) => {
    try {
        res.clearCookie('refreshtoken', { path: '/api/auth/refresh_token' });
        return res.status(200).json({ msg: "Logged out successfully" });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.generateAccessToken = async (req, res) => {
    try {
        const rf_token = req.cookies.refreshtoken;
        if (!rf_token) {
            return res.status(400).json({ msg: "Log in" });
        }
        jwt.verify(rf_token, process.env.REFRESH_TOKEN, async (err, result) => {
            if (err) {
                return res.status(400).json({ msg: "Log in" });
            }
            const user = await Users.findById(result.id).select("-password")
                .populate("followers following");
            if (!user) {
                return res.status(400).json({ msg: "Log in" });
            }
            const acces_token = createAccessToken({ id: result.id });
            return res.status(200).json({
                acces_token,
                user
            });
        });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
};

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN, { expiresIn: '30d' });
};

module.exports.sendResetPassword = async (req, res) => {
    try {
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(req.body.email)) {
            return res.status(400).json({ msg: 'Invalid or email address' });
        }
        let user = await Users.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ msg: 'Email not found' });
        }
        let email_token = await EmailToken.findOne({ userId: user._id });
        if (!email_token) {
            token = await new EmailToken({
                userId: user._id,
                token: crypto.randomBytes(32).toString('hex')
            }).save();
        }
        const url = `${process.env.BASE_URL}/password-reset/${user._id}/${email_token.token}`;
        await sendEmail(user.email, user.fullname, "Password Reset", url);

        return res.status(200).json({ msg: 'Email Sent Successfully' });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.verifyUrl = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(400).json({ msg: 'Invalid URL' });
        }
        const email_token = await EmailToken.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!email_token) {
            return res.status(400).json({ msg: 'Invalid URL' });
        }
        return res.status(200).json({ msg: 'Valid URL' });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.resetPassword = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(400).json({ msg: 'Invalid URL' });
        }
        const email_token = await EmailToken.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!email_token) {
            return res.status(400).json({ msg: 'Invalid URL' });
        }
        if (!user.isConfirmed) {
            user.isConfirmed = true;
        }
        const passwordHash = await bcrypt.hash(req.body.password, 12);
        user.password = passwordHash;
        await user.save();
        await email_token.remove();
        return res.status(200).json({ msg: 'Password reset successfully' });
    }
    catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};