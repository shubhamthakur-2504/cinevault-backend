import mongoose from "mongoose";
import fs from "fs";
import Movie from "../models/movie.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { movieInsertQueue } from "../queue/movie.queue.js";

// get all movies with pagination
const getAllMovies = asyncHandler(async (req, res, next) => {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    let cursor = null;
    if (req.query.cursor) {
        try {
            if(mongoose.isValidObjectId(req.query.cursor)){
                cursor = req.query.cursor;
            }
        } catch (e) {
            cursor = null;
        }
    }
    const query = cursor ? { _id: { $lt: cursor } } : {};

    const movies = await Movie.find(query).sort({ _id: -1 }).limit(limit + 1).select("-__v -updatedAt").lean();
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

// search movies
const searchMovies = asyncHandler(async (req, res, next) => {
    const searchTerm = (req.query.q || "").trim();
    if (!searchTerm) {
        return res.status(400).json(new apiError(400, "Search term is required"));
    }

    const movies = await Movie.aggregate([
        { $match: { $text: { $search: searchTerm } } },
        { $addFields: { score: { $meta: "textScore" } } },

        {
            $group: {
                _id: null,
                maxScore: { $max: "$score" },
                docs: { $push: "$$ROOT" }
            }
        },

        // Keep only strong matches (>= 45% of best)
        { $unwind: "$docs" },
        {
            $match: {
                $expr: {
                    $gte: [
                        "$docs.score",
                        { $multiply: ["$maxScore", 0.45] }
                    ]
                }
            }
        },

        { $replaceRoot: { newRoot: "$docs" } },
        { $sort: { score: -1 } },
        { $project: { __v: 0, updatedAt: 0 } }
    ]);


    return res.status(200).json(new apiResponse(200, movies.length === 0 ? "No movies found" : "Movies fetched successfully", { movies }));
})

// edit movie by admin only
const editMovie = asyncHandler(async (req, res, next) => {
    const movieId = req.params.id;
    const rawUpdateData = req.body;
    const localFilePath = req.file.path;
    let flag = false;
    let uploadResult = null;
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json(new apiError(403, "Forbidden: Admins only"));
        }
        if (!movieId) {
            return res.status(400).json(new apiError(400, "Movie ID is required"));
        }
        if(!mongoose.isValidObjectId(movieId)){
            return res.status(400).json(new apiError(400, "Invalid movie ID"));
        }
    
        const oldMovie = await Movie.findById(movieId).lean();
        if (!oldMovie) {
            return res.status(404).json(new apiError(404, "Movie not found"));
        }
    
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
        const allowedFields = ["title", "description", "rating", "releaseDate", "duration", "genre"];
    
        for (const field of allowedFields) {
            if (rawUpdateData[field]) {
                updateData[field] = rawUpdateData[field];
            }
        }
    
        if (rawUpdateData.genre !== undefined) {
            if (Array.isArray(rawUpdateData.genre)) {
                updateData.genre = rawUpdateData.genre.map(g => g.trim());
            } else if (typeof rawUpdateData.genre === "string") {
                updateData.genre = rawUpdateData.genre.split(",").map(g => g.trim());
            } else {
                return res.status(400).json(new apiError(400, "Invalid genre format"));
            }
        }
        
        if (localFilePath) {
            try {
                uploadResult = await uploadOnCloudinary(localFilePath);
                if (uploadResult && uploadResult.url) {
                    updateData.posterUrl = uploadResult.url;
                    flag = true;
                } else {
                    fs.unlink(localFilePath);
                    return res.status(500).json(new apiError(500, "Failed to upload poster to Cloudinary"));
                }
            } catch (err) {
                fs.unlink(localFilePath);
                return res.status(500).json(new apiError(500, "Cloudinary upload error"));
            }
        }
    
        const updatedMovie = await Movie.findByIdAndUpdate(movieId, updateData, { new: true, runValidators: true }).select("-__v -updatedAt").lean();
    
        if (flag) {
            try {
                deleteFromCloudinary(oldMovie.posterUrl);
                console.log("Deleted old poster from Cloudinary");
            } catch (error) {
                console.log("Error deleting old poster from Cloudinary:", error);
            }
        }
    
        return res.status(200).json(new apiResponse(200, "Movie updated successfully", { movie: updatedMovie }));
    } catch (error) {
        if (localFilePath) {
            fs.unlink(localFilePath);
        }
        if (flag && uploadResult) {
            deleteFromCloudinary(uploadResult.url);
        }
        return res.status(500).json(new apiError(500, "Internal Server Error"));
    }
})

// delete movie by admin only
const deleteMovie = asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(new apiError(403, "Forbidden: Admins only"));
    }

    const movieId = req.params.id;
    if (!mongoose.isValidObjectId(movieId)) {
        return res.status(400).json(new apiError(400, "Invalid movie ID"));
    }
    
    const deletedMovie = await Movie.findByIdAndDelete(movieId);
    if (!deletedMovie) {
        return res.status(404).json(new apiError(404, "Movie not found"));
    }

    try {
        deleteFromCloudinary(deletedMovie.posterUrl);
        console.log("Deleted poster from Cloudinary");
    } catch (error) {
        confirm.log("Error deleting poster from Cloudinary:", error);
    }

    return res.status(200).json(new apiResponse(200, "Movie deleted successfully"));
})

// create movie by admin only
const createMovie = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(new apiError(403, "Forbidden: Admins only"));
    }

    let { title, description, posterUrl, rating, releaseDate, duration, genre } = req.body;
    let localFilePath = req.file ? req.file.path : null;
    if (!title || rating === undefined || !releaseDate || duration === undefined) {
        return res.status(400).json(new apiError(400, "All required fields must be provided"));
    }
    if (!posterUrl && !localFilePath) {
        return res.status(400).json(new apiError(400, "Poster must be provided"));
    }

    title = title.trim();
    description = description ? description.trim() : "";
    rating = parseFloat(rating);
    duration = parseInt(duration);
    releaseDate = new Date(releaseDate);
    if (posterUrl) {
        posterUrl = posterUrl.trim();
    }

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

    if (localFilePath) {
        try {
            const uploadResult = await uploadOnCloudinary(localFilePath);
            if (uploadResult && uploadResult.url) {
                posterUrl = uploadResult.url;
            } else {
                fs.unlink(localFilePath);
                return res.status(500).json(new apiError(500, "Failed to upload poster to Cloudinary"));
            }
        } catch (err) {
            fs.unlink(localFilePath);
            return res.status(500).json(new apiError(500, "Cloudinary upload error"));
        }
    }

    try {
        const movieData ={
            title,
            description,
            posterUrl,
            rating,
            releaseDate,
            duration,
            genre,
            createdBy: req.user._id
        };
        
        await movieInsertQueue.add("insert-movie", movieData)

        return res.status(202).json(new apiResponse(202, "Movie added to queue successfully"));
    } catch (error) {
        if (localFilePath) {
            fs.unlink(localFilePath);
        }
        if (posterUrl) {
            deleteFromCloudinary(posterUrl);
        }
        return res.status(500).json(new apiError(500, "Internal Server Error"));
    }

})

export { getAllMovies, getMoviesSorted, searchMovies, editMovie, deleteMovie, createMovie };