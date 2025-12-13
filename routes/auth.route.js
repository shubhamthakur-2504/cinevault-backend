import { Router } from "express";
import { registerUser, loginUser, getUserProfile, refreshAccessToken, logoutUser } from "../controllers/auth.controller.js";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/profile", verifyJwtToken, getUserProfile);
router.post("/logout", verifyJwtToken, logoutUser);

export default router;