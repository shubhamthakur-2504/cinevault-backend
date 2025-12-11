import mongoose from "mongoose";
import Movie from "../models/movie.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// get all movies with pagination
const getAllMovies = asyncHandler(async (req, res, next) => {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    let cursor = null;
    if (req.query.cursor) {
        try {
            cursor = mongoose.Types.ObjectId(req.query.cursor);
        } catch (e) {
            cursor = null;
        }
    }
    const query = cursor ? { _id: { $lt: cursor } } : {};

    const movies = await Movie.find(query).sort({ createdAt: -1 }).limit(limit + 1).select("-__v -updatedAt").lean();
    const hasNextPage = movies.length > limit;
    const nextCursor = hasNextPage ? movies[movies.length - 1]._id : null;
    if (hasNextPage) {
        movies.pop();
    }

    return res.status(200).json(new apiResponse(200, "Movies fetched successfully", { movies, hasNextPage, nextCursor }));

})

// get movies sorted by rating, releaseDate, duration, name
const getMoviesSorted = asyncHandler(async (req, res, next) => {
    let sortOptions = {};
    if (req.query.rating) {
        sortOptions.rating = req.query.rating.toLowerCase() === "asc" ? 1 : -1;
    }
    if (req.query.releaseDate) {
        sortOptions.releaseDate = req.query.releaseDate.toLowerCase() === "asc" ? 1 : -1;
    }
    if (req.query.duration) {
        sortOptions.duration = req.query.duration.toLowerCase() === "asc" ? 1 : -1;
    }
    if (req.query.name) {
        sortOptions.name = req.query.name.toLowerCase() === "asc" ? 1 : -1;
    }
    const movies = await Movie.find({}).sort(sortOptions).select("-__v -updatedAt").lean();
    if (movies.length === 0) {
        return res.status(200).json(new apiResponse(200, "No movies found", { movies }));
    } else {
        return res.status(200).json(new apiResponse(200, "Movies fetched successfully", { movies }));
    }
})

const searchMovies = asyncHandler(async (req, res, next) => {
    const searchTerm = (req.query.q || "").trim();
    if (!searchTerm) {
        return res.status(400).json(new apiError(400, "Search term is required"));
    }

    const movies = await Movie.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } }).select("-__v -updatedAt").lean();

    return res.status(200).json(new apiResponse(200, movies.length === 0 ? "No movies found" : "Movies fetched successfully", { movies }));
})



export { getAllMovies, getMoviesSorted, searchMovies };