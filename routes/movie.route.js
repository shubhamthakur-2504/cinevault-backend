import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/admin.middleware.js";
import { getAllMovies, getMoviesSorted, searchMovies, editMovie, deleteMovie, createMovie } from "../controllers/movie.controller.js";
import upload from "../middlewares/multer.js";

const router = Router();

router.get("/", getAllMovies);
router.get("/sorted", getMoviesSorted);
router.get("/search", searchMovies);
router.patch("/:id", verifyJwtToken, adminOnly, upload.single("poster"), editMovie);
router.delete("/:id", verifyJwtToken, adminOnly, deleteMovie);
router.post("/", verifyJwtToken, adminOnly, upload.single("poster"), createMovie);

export default router;