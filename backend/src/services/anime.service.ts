import { env } from "../config/configs";
import CustomError from "../errors/custom.errors";
import { AniListPage, AnimeDetails, AnimeSort } from "../types/anime.types";

const ANILIST_API_URL = env.ANILIST_API_URL;

interface AniListResponse<T> {
    data?: T;
    errors?: {
        message: string;
    }[];
}

export async function queryAniList<T>(
    query: string,
    variables: Record<string, unknown> = {},
): Promise<T> {
    const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    const result = (await response.json()) as AniListResponse<T>;

    if (!response.ok && !result.data) {
        throw new CustomError("AniList API request failed", response.status);
    }

    if (!result.data) {
        throw new CustomError("AniList returned no data", 500);
    }

    return result.data;
}

export async function getAnimeList(sort: AnimeSort, page = 1, perPage = 10) {
    const query = `
        query (
            $page: Int
            $perPage: Int
            $sort: [MediaSort]
        ) {
            Page(
                page: $page
                perPage: $perPage
            ) {
                pageInfo {
                    currentPage
                    hasNextPage
                    lastPage
                    perPage
                    total
                }

                media(
                    type: ANIME
                    sort: $sort
                ) {
                    id

                    title {
                        romaji
                        english
                        native
                    }

                    coverImage {
                        large
                        extraLarge
                    }

                    bannerImage

                    averageScore
                    popularity
                    trending

                    episodes
                    status
                    format

                    genres

                    startDate {
                        year
                        month
                        day
                    }
                }
            }
        }
    `;

    const result = await queryAniList<{ Page: AniListPage }>(query, {
        page,
        perPage,
        sort: [sort],
    });

    return result.Page;
}

export async function getTrendingAnime(page = 1, perPage = 10) {
    return getAnimeList("TRENDING_DESC", page, perPage);
}

export async function getPopularAnime(page = 1, perPage = 10) {
    return getAnimeList("POPULARITY_DESC", page, perPage);
}

export async function getTopRatedAnime(page = 1, perPage = 10) {
    return getAnimeList("SCORE_DESC", page, perPage);
}

export async function getAiringAnime(page = 1, perPage = 10) {
    const query = `
        query (
            $page: Int
            $perPage: Int
        ) {
            Page(
                page: $page
                perPage: $perPage
            ) {
                pageInfo {
                    currentPage
                    hasNextPage
                    lastPage
                    perPage
                    total
                }

                media(
                    type: ANIME
                    status: RELEASING
                    sort: POPULARITY_DESC
                ) {
                    id

                    title {
                        romaji
                        english
                        native
                    }

                    coverImage {
                        large
                        extraLarge
                    }

                    bannerImage

                    averageScore
                    popularity
                    trending

                    episodes
                    status
                    format

                    genres

                    startDate {
                        year
                        month
                        day
                    }
                }
            }
        }
    `;

    const result = await queryAniList<{ Page: AniListPage }>(query, {
        page,
        perPage,
    });

    return result.Page;
}

export async function searchAnime(search: string, page = 1, perPage = 10) {
    const query = `
        query (
            $search: String
            $page: Int
            $perPage: Int
        ) {
            Page(
                page: $page
                perPage: $perPage
            ) {
                pageInfo {
                    currentPage
                    hasNextPage
                    lastPage
                    perPage
                    total
                }

                media(
                    type: ANIME
                    search: $search
                    sort: SEARCH_MATCH
                ) {
                    id

                    title {
                        romaji
                        english
                        native
                    }

                    coverImage {
                        large
                        extraLarge
                    }

                    bannerImage

                    averageScore
                    popularity
                    trending

                    episodes
                    status
                    format

                    genres

                    startDate {
                        year
                        month
                        day
                    }
                }
            }
        }
    `;

    const result = await queryAniList<{ Page: AniListPage }>(query, {
        search,
        page,
        perPage,
    });

    if (result.Page.media.length === 0) {
        throw new CustomError("No anime found matching the search query", 404);
    }

    return result.Page;
}

export async function getAnimeById(id: number) {
    const query = `
        query ($id: Int!) {
            Media(
                id: $id
                type: ANIME
            ) {
                id
                idMal

                title {
                    romaji
                    english
                    native
                }

                description(asHtml: false)

                type
                format
                status

                startDate {
                    year
                    month
                    day
                }

                endDate {
                    year
                    month
                    day
                }

                season
                seasonYear

                episodes
                duration

                countryOfOrigin

                isAdult

                averageScore
                meanScore
                popularity
                trending

                genres

                coverImage {
                    large
                    extraLarge
                }

                bannerImage

                studios {
                    edges {
                        isMain
                        node {
                            id
                            name
                        }
                    }
                }

                characters(sort: [ROLE, RELEVANCE]) {
                    edges {
                        role
                        node {
                            id
                            name {
                                full
                                native
                            }
                            image {
                                large
                            }
                        }
                        voiceActors(language: JAPANESE) {
                            id
                            name {
                                full
                                native
                            }
                            image {
                                large
                            }
                        }
                    }
                }
            }
        }
    `;

    const result = await queryAniList<{ Media: AnimeDetails | null }>(query, {
        id,
    });

    if (!result.Media) {
        throw new CustomError(`Anime with ID ${id} not found`, 404);
    }

    return result.Media;
}

export async function getAnimeByIds(ids: number[]) {
    if (ids.length === 0) {
        return [];
    }

    const query = `
        query ($ids: [Int]) {
            Page {
                media(
                    id_in: $ids
                    type: ANIME
                ) {
                    id

                    title {
                        romaji
                        english
                        native
                    }

                    coverImage {
                        large
                        extraLarge
                    }

                    bannerImage

                    averageScore
                    popularity
                    trending

                    episodes
                    status
                    format

                    genres

                    startDate {
                        year
                        month
                        day
                    }
                }
            }
        }
    `;

    const result = await queryAniList<{
        Page: AniListPage;
    }>(query, {
        ids,
    });

    return result.Page.media;
}
