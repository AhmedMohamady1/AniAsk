import { Router } from "express";
import {
    trendingAnime,
    popularAnime,
    topRatedAnime,
    airingAnime,
    searchAnimeController,
    animeDetails,
} from "../controllers/anime.controller";
import { validate } from "../middlewares/validation.middleware";
import {
    paginationSchema,
    searchAnimeSchema,
    animeIdSchema,
} from "../validators/anime.validator";

const router = Router();

router.get("/trending", validate(paginationSchema), trendingAnime);
router.get("/popular", validate(paginationSchema), popularAnime);
router.get("/top-rated", validate(paginationSchema), topRatedAnime);
router.get("/airing", validate(paginationSchema), airingAnime);
router.get("/search", validate(searchAnimeSchema), searchAnimeController);
router.get("/:id", validate(animeIdSchema), animeDetails);

export default router;
