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

const editMovie = asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(new apiError(403, "Forbidden: Admins only"));
    }
    const movieId = req.params.id;
    const rawUpdateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json(new apiError(400, "Invalid movie ID"));
    }
    if (rawUpdateData.title && rawUpdateData.title.trim() === "") {
        return res.status(400).json(new apiError(400, "Title cannot be empty"));
    }
    if (rawUpdateData.rating && (isNaN(rawUpdateData.rating) || rawUpdateData.rating < 0 || rawUpdateData.rating > 10)) {
        return res.status(400).json(new apiError(400, "Rating must be a number between 0 and 10"));
    }
    if (rawUpdateData.releaseDate && isNaN(Date.parse(rawUpdateData.releaseDate))) {
        return res.status(400).json(new apiError(400, "Invalid release date"));
    }
    if (rawUpdateData.duration && (isNaN(rawUpdateData.duration) || rawUpdateData.duration <= 0)) {
        return res.status(400).json(new apiError(400, "Duration must be a positive number"));
    }

    const updateData = {};
    const allowedFields = ["title", "description", "posterUrl", "rating", "releaseDate", "duration", "genre"];

    for (const field of allowedFields) {
        if (rawUpdateData[field]) {
            updateData[field] = rawUpdateData[field];
        }
    }

    // implement cloudinary upload for posterUrl 
    const updatedMovie = await Movie.findByIdAndUpdate(movieId, updateData, { new: true, runValidators: true }).select("-__v -updatedAt").lean();
    if (!updatedMovie) {
        return res.status(404).json(new apiError(404, "Movie not found"));
    }
    return res.status(200).json(new apiResponse(200, "Movie updated successfully", { movie: updatedMovie }));
})

const deleteMovie = asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.role !== 'ADMIN') {
        return res.status(403).json(new apiError(403, "Forbidden: Admins only"));
    }
    const movieId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json(new apiError(400, "Invalid movie ID"));
    }
    // implement cloudinary delete
    const deletedMovie = await Movie.findByIdAndDelete(movieId);
    if (!deletedMovie) {
        return res.status(404).json(new apiError(404, "Movie not found"));
    }

    return res.status(200).json(new apiResponse(200, "Movie deleted successfully"));
})


const createMovie = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(new apiError(403, "Forbidden: Admins only"));
    }
    let { title, description, posterUrl, rating, releaseDate, duration, genre } = req.body;

    if (!title || !posterUrl || rating === undefined || !releaseDate || duration === undefined) {
        return res.status(400).json(new apiError(400, "All required fields must be provided"));
    }

    title = title.trim();
    description = description ? description.trim() : "";
    posterUrl = posterUrl.trim();
    rating = parseFloat(rating);
    duration = parseInt(duration);
    releaseDate = new Date(releaseDate);
    
    if (Array.isArray(genre)) {
        genre = genre.map(g => String(g).trim()).filter(Boolean);
    } else if (typeof genre === "string") {
        genre = genre.split(",").map(g => g.trim()).filter(Boolean);
    } else {
        genre = [];
    }

    if (isNaN(rating) || rating < 0 || rating > 10) {
        return res.status(400).json(new apiError(400, "Rating must be a number between 0 and 10"));
    }
    if (isNaN(duration) || duration <= 0) {
        return res.status(400).json(new apiError(400, "Duration must be a positive number"));
    }
    if (isNaN(releaseDate.getTime())) {
        return res.status(400).json(new apiError(400, "Invalid release date"));
    }

    // implement cloudinary upload for posterUrl

    try {
        const newMovie = new Movie({
            title,
            description,
            posterUrl,
            rating,
            releaseDate,
            duration,
            genre,
            createdBy: req.user._id
        });
        // need to implement lazy insertion
        await newMovie.save();
        return res.status(201).json(new apiResponse(201, "Movie created successfully", { movie: newMovie }));
    } catch (error) {
        return res.status(500).json(new apiError(500, "Internal Server Error"));
    }

})

export { getAllMovies, getMoviesSorted, searchMovies };