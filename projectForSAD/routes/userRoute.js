const express = require('express');
const auth = require("../middleware/auth");
const { searchUser, getUser, follow, isFollowing, setUser, getEditChecker, getUserById, emailVerification } = require('../controllers/userController');
const router = express.Router();

router.get('/search', auth, searchUser);
router.get('/user/:id', auth, getUser);
router.post('/follow', auth, follow);
router.post('/isFollowing', auth, isFollowing);
router.post('/setUser/:id', auth, setUser);
router.get('/getEditChecker/:id', auth, getEditChecker);
router.get('/getUserById/:id', auth, getUserById);
router.get('/:id/verify/:token', emailVerification)

module.exports = router;