export type AnimeSort =
    | "TRENDING_DESC"
    | "POPULARITY_DESC"
    | "SCORE_DESC"
    | "START_DATE_DESC";

export interface AnimeTitle {
    romaji: string | null;
    english: string | null;
    native: string | null;
}

export interface AnimeCoverImage {
    large: string | null;
    extraLarge: string | null;
}

export interface AnimeStartDate {
    year: number | null;
    month: number | null;
    day: number | null;
}

export interface Anime {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCoverImage;
    bannerImage: string | null;
    averageScore: number | null;
    popularity: number | null;
    trending: number | null;
    episodes: number | null;
    status: string;
    format: string | null;
    genres: string[];
    startDate: AnimeStartDate;
}

interface AnimeCharacter {
    id: number;
    name: {
        full: string;
        native: string | null;
    };
    image: {
        large: string | null;
    };
}

export interface AnimeDetails extends Anime {
    idMal: number | null;
    description: string | null;
    type: string;
    endDate: AnimeStartDate;
    season: string | null;
    seasonYear: number | null;
    duration: number | null;
    countryOfOrigin: string | null;
    isAdult: boolean;
    meanScore: number | null;

    studios: {
        edges: {
            isMain: boolean;
            node: {
                id: number;
                name: string;
            };
        }[];
    };
    characters: {
        edges: {
            role: string;
            nodes: AnimeCharacter;
            voiceActors: {
                id: number;
                name: {
                    full: string;
                    native: string | null;
                };
                image: {
                    large: string | null;
                };
            };
        }[];
    }[];
}

export interface AniListPageInfo {
    currentPage: number;
    hasNextPage: boolean;
    lastPage: number;
    perPage: number;
    total: number;
}

export interface AniListPage {
    pageInfo: AniListPageInfo;
    media: Anime[];
}

export interface animePaginationQueryValidation {
    q: string;
    page: number;
    perPage: number;
}
