import { Request, Response } from "express";
import {
    getTrendingAnime,
    getPopularAnime,
    getTopRatedAnime,
    getAiringAnime,
    searchAnime,
    getAnimeById,
} from "../services/anime.service";

import { animePaginationQueryValidation } from "../types/anime.types";

export const trendingAnime = async (req: Request, res: Response) => {
    const { page, perPage } = res.locals.validated
        .query as animePaginationQueryValidation;

    const data = await getTrendingAnime(page, perPage);

    res.status(200).json({
        status: "success",
        data,
    });
};

export const popularAnime = async (req: Request, res: Response) => {
    const { page, perPage } = res.locals.validated
        .query as animePaginationQueryValidation;

    const data = await getPopularAnime(page, perPage);

    res.status(200).json({
        status: "success",
        data,
    });
};

export const topRatedAnime = async (req: Request, res: Response) => {
    const { page, perPage } = res.locals.validated
        .query as animePaginationQueryValidation;

    const data = await getTopRatedAnime(page, perPage);

    res.status(200).json({
        status: "success",
        data,
    });
};

export const airingAnime = async (req: Request, res: Response) => {
    const { page, perPage } = res.locals.validated
        .query as animePaginationQueryValidation;

    const data = await getAiringAnime(page, perPage);

    res.status(200).json({
        status: "success",
        data,
    });
};

export const searchAnimeController = async (req: Request, res: Response) => {
    const { q, page, perPage } = res.locals.validated
        .query as animePaginationQueryValidation;

    const data = await searchAnime(q, page, perPage);

    res.status(200).json({
        status: "success",
        data,
    });
};

export const animeDetails = async (req: Request, res: Response) => {
    const { id } = res.locals.validated.params;

    const data = await getAnimeById(id);

    res.status(200).json({
        status: "success",
        data,
    });
};
