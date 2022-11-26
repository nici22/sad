const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50,
    },
    username: {
        type: String,
        required: true,
        maxLength: 25,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    editChecker: {
        type: Number,
        default: 0,
    }
    ,
    avatar: {
        public_id: {
            type: String,
            required: false,
            default: '',
        },
        url: {
            type: String,
            required: false,
            default: '',
        },
    },
    user: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        default: 'user',
    },
    gender: {
        type: String,
        default: 'male',
    },
    mobile: {
        type: String,
        default: '',
    },
    address: {
        type: String,
        default: 'Belong to the streets',
    },
    story: {
        type: String,
        default: 'Hey, I joined new',
        maxlength: 200,
    },
    website: {
        type: String,
        default: '',
    },
    followers: [{
        type: mongoose.Types.ObjectId,
        ref: 'user'
    }],
    following: [{
        type: mongoose.Types.ObjectId,
        ref: 'user'
    }],
    isConfirmed: {
        type: Boolean,
        default: false,
    },
    isSubscribed: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('user', userSchema);