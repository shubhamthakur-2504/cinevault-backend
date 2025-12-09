import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        index: "text"
    },
    posterUrl: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
        index: true
    },
    releaseDate: {
        type: Date,
        required: true,
        index: true
    },
    duration: {
        type: Number,
        required: true,
        index: true
    },
    genre: {
        type: [String],
        default: []
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
},{timestamps: true});

movieSchema.index({ title: "text", description: "text" });

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
