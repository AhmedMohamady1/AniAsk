import { Request, Response } from "express";
import {
    createTrackingEntry,
    deleteTrackingEntry,
    getUserTracking,
    updateTrackingEntry,
} from "../services/tracking.service";
import CustomError from "../errors/custom.errors";
import { getAnimeByIds } from "../services/anime.service";

export const createTracking = async (req: Request, res: Response) => {
    const { animeId, status, ratings, reviews } = res.locals.validated.body;

    const userId = req.user!.userId;

    const data = await createTrackingEntry(
        userId,
        animeId,
        status,
        ratings,
        reviews,
    );

    res.status(201).json({
        status: "success",
        data,
    });
};

export const getTracking = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { status, page, perPage } = res.locals.validated.query;

    const { data: tracking, total } = await getUserTracking(
        userId,
        page,
        perPage,
        status,
    );
    const animeIds = tracking.map((item) => item.animeId);

    const anime = await getAnimeByIds(animeIds);

    const animeMap = new Map(anime.map((item) => [item.id, item]));

    const data = tracking.map((item) => ({
        anime: animeMap.get(item.animeId) ?? null,
        tracking: {
            id: item.id,
            status: item.status,
            ratings: item.ratings,
            reviews: item.reviews,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        },
    }));

    const lastPage = Math.ceil(total / perPage);

    res.status(200).json({
        status: "success",
        data,
        pageInfo: {
            currentPage: page,
            perPage,
            total,
            lastPage,
            hasNextPage: page < lastPage,
        },
    });
};

export const updateTracking = async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const { animeId } = res.locals.validated.params;
    const body = res.locals.validated.body;

    const data = await updateTrackingEntry(userId, animeId, body);

    res.status(200).json({
        status: "success",
        data,
    });
};

export const deleteTracking = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { animeId } = res.locals.validated.params;

    const data = await deleteTrackingEntry(userId, animeId);

    if (!data) {
        throw new CustomError(`Tracking for anime ${animeId} not found`, 404);
    }

    res.status(200).json({
        status: "success",
        message: "Tracking entry deleted successfully",
    });
};
