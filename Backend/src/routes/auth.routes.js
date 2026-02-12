const express = require('express');
const authControllers = require("../controllers/auth.controller");
const { authUser } = require("../middlewares/auth.middleware");
const router = express.Router();



router.post("/register", authControllers.registerUser)
router.post("/login", authControllers.loginUser)
router.get("/me", authUser, authControllers.getMe)



module.exports = router;