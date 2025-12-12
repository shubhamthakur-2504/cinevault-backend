import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/admin.middleware";
import { getAllMovies, getMoviesSorted, searchMovies, editMovie, deleteMovie, createMovie } from "../controllers/movie.controller";

const router = Router();

router.get("/", getAllMovies);
router.get("/sorted", getMoviesSorted);
router.get("/search", searchMovies);
router.put("/:id", verifyJwtToken, adminOnly, editMovie);
router.delete("/:id", verifyJwtToken, adminOnly, deleteMovie);
router.post("/", verifyJwtToken, adminOnly, createMovie);

export default router;