import mongoose from "mongoose";
import Movie from "../models/movie.model.js";
import dotenv from "dotenv";

dotenv.config({ path: "./scripts/.env" });

const OMDB_API = "https://www.omdbapi.com/";
const API_KEY = process.env.OMDB_API_KEY;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomBetween = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const seedLiveAction = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const docs = [];
    const keywords = [
        "the", "man", "love", "war", "dark",
        "life", "world", "king", "night", "day"
    ];

    for (const keyword of keywords) {
        for (let page = 1; page <= 5; page++) {
            const res = await fetch(
                `${OMDB_API}?apikey=${API_KEY}&s=${keyword}&page=${page}`
            );

            if (!res.ok) continue;

            const data = await res.json();
            if (!data.Search) break;

            for (const item of data.Search) {
                if (!item.imdbID) continue;

                // Fetch full details
                const detailRes = await fetch(
                    `${OMDB_API}?apikey=${API_KEY}&i=${item.imdbID}&plot=short`
                );

                if (!detailRes.ok) continue;

                const m = await detailRes.json();

                if (m.Response === "False") continue;

                docs.push({
                    title: m.Title,
                    description: m.Plot !== "N/A" ? m.Plot : "No description available",
                    posterUrl: m.Poster !== "N/A" ? m.Poster : "",
                    rating: parseFloat(m.imdbRating) || 7,
                    releaseDate: m.Released !== "N/A"
                        ? new Date(m.Released)
                        : new Date(),
                    duration: m.Runtime !== "N/A"
                        ? parseInt(m.Runtime)
                        : randomBetween(90, 180),
                    genre: m.Type === "series" ? ["Series"] : ["Movie"],
                    createdBy: null
                });

                if (docs.length >= 800) break;
            }

            if (docs.length >= 800) break;

            await sleep(300); // OMDb rate safety
        }

        if (docs.length >= 800) break;
    }

    await Movie.insertMany(docs);
    console.log(`Inserted ${docs.length} live-action entries`);
    process.exit();
};

seedLiveAction();
