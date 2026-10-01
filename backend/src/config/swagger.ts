import swaggerJSDoc from "swagger-jsdoc";
import { registerUserSchema } from "../validators/auth.validator";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "AniAsk API",
            version: "1.0.0",
            description: "REST API for AniAsk anime application",
        },

        servers: [
            {
                url: "/",
            },
        ],

        tags: [
            {
                name: "Auth",
                description: "Authentication and user account endpoints",
            },
            {
                name: "Anime",
                description: "Anime discovery and information endpoints",
            },
            {
                name: "Tracking",
                description: "Anime tracking, reviews and ratings",
            },
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },

            schemas: {
                RegisterUser: {
                    type: "object",
                    required: [
                        "username",
                        "email",
                        "password",
                        "firstName",
                        "lastName",
                    ],
                    properties: {
                        username: {
                            type: "string",
                            minLength: 5,
                            maxLength: 50,
                            example: "muhammedmahmoud0",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            maxLength: 50,
                            example: "muhammed.mahmoud@example.com",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            minLength: 8,
                            maxLength: 128,
                            example: "123456789",
                        },
                        firstName: {
                            type: "string",
                            minLength: 2,
                            maxLength: 30,
                            example: "Muhammed",
                        },
                        lastName: {
                            type: "string",
                            minLength: 2,
                            maxLength: 30,
                            example: "Mahmoud",
                        },
                    },
                },

                LoginWithEmail: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            maxLength: 50,
                            example: "muhammed.mahmoud@example.com",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            minLength: 8,
                            maxLength: 128,
                            example: "123456789",
                        },
                    },
                },

                LoginWithUsername: {
                    type: "object",
                    required: ["username", "password"],
                    properties: {
                        username: {
                            type: "string",
                            minLength: 5,
                            maxLength: 50,
                            example: "muhammedmahmoud0",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            minLength: 8,
                            maxLength: 128,
                            example: "123456789",
                        },
                    },
                },

                VerifyEmail: {
                    type: "object",
                    required: ["email", "otp"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "muhammed.mahmoud@example.com",
                        },
                        otp: {
                            type: "string",
                            pattern: "^\\d{6}$",
                            minLength: 6,
                            maxLength: 6,
                            example: "123456",
                        },
                    },
                },

                ResendVerification: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "muhammed.mahmoud@example.com",
                        },
                    },
                },

                Pagination: {
                    type: "object",
                    properties: {
                        page: {
                            type: "integer",
                            minimum: 1,
                            default: 1,
                            example: 1,
                        },
                        perPage: {
                            type: "integer",
                            minimum: 1,
                            maximum: 50,
                            default: 10,
                            example: 10,
                        },
                    },
                },

                Tracking: {
                    type: "object",
                    required: ["animeId", "status"],
                    properties: {
                        animeId: {
                            type: "integer",
                            minimum: 1,
                            example: 1535,
                        },
                        status: {
                            type: "string",
                            enum: [
                                "watching",
                                "completed",
                                "on_hold",
                                "dropped",
                                "planning",
                            ],
                            example: "watching",
                        },
                        ratings: {
                            type: "integer",
                            minimum: 0,
                            maximum: 100,
                            example: 85,
                        },
                        reviews: {
                            type: "string",
                            example: "Really enjoyable anime.",
                        },
                    },
                },

                UpdateTracking: {
                    type: "object",
                    minProperties: 1,
                    properties: {
                        status: {
                            type: "string",
                            enum: [
                                "watching",
                                "completed",
                                "on_hold",
                                "dropped",
                                "planning",
                            ],
                            example: "completed",
                        },
                        ratings: {
                            type: "integer",
                            minimum: 0,
                            maximum: 100,
                            example: 90,
                        },
                        reviews: {
                            type: "string",
                            example: "Amazing ending.",
                        },
                    },
                },
                AnimeTitle: {
                    type: "object",
                    properties: {
                        romaji: {
                            type: "string",
                            nullable: true,
                            example: "Naruto",
                        },
                        english: {
                            type: "string",
                            nullable: true,
                            example: "Naruto",
                        },
                        native: {
                            type: "string",
                            nullable: true,
                            example: "ナルト",
                        },
                    },
                },

                AnimeCoverImage: {
                    type: "object",
                    properties: {
                        large: {
                            type: "string",
                            nullable: true,
                            format: "uri",
                        },
                        extraLarge: {
                            type: "string",
                            nullable: true,
                            format: "uri",
                        },
                    },
                },

                AnimeStartDate: {
                    type: "object",
                    properties: {
                        year: {
                            type: "integer",
                            nullable: true,
                            example: 2002,
                        },
                        month: {
                            type: "integer",
                            nullable: true,
                            example: 10,
                        },
                        day: {
                            type: "integer",
                            nullable: true,
                            example: 3,
                        },
                    },
                },
                Anime: {
                    type: "object",
                    required: [
                        "id",
                        "title",
                        "coverImage",
                        "bannerImage",
                        "averageScore",
                        "popularity",
                        "trending",
                        "episodes",
                        "status",
                        "format",
                        "genres",
                        "startDate",
                    ],
                    properties: {
                        id: {
                            type: "integer",
                            example: 20,
                        },

                        title: {
                            $ref: "#/components/schemas/AnimeTitle",
                        },

                        coverImage: {
                            $ref: "#/components/schemas/AnimeCoverImage",
                        },

                        bannerImage: {
                            type: "string",
                            nullable: true,
                            format: "uri",
                        },

                        averageScore: {
                            type: "number",
                            nullable: true,
                            example: 85,
                        },

                        popularity: {
                            type: "integer",
                            nullable: true,
                            example: 120000,
                        },

                        trending: {
                            type: "integer",
                            nullable: true,
                            example: 42,
                        },

                        episodes: {
                            type: "integer",
                            nullable: true,
                            example: 220,
                        },

                        status: {
                            type: "string",
                            example: "FINISHED",
                        },

                        format: {
                            type: "string",
                            nullable: true,
                            example: "TV",
                        },

                        genres: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            example: ["Action", "Adventure", "Shounen"],
                        },

                        startDate: {
                            $ref: "#/components/schemas/AnimeStartDate",
                        },
                    },
                },
                AniListPageInfo: {
                    type: "object",
                    properties: {
                        currentPage: {
                            type: "integer",
                            example: 1,
                        },
                        hasNextPage: {
                            type: "boolean",
                            example: true,
                        },
                        lastPage: {
                            type: "integer",
                            example: 10,
                        },
                        perPage: {
                            type: "integer",
                            example: 10,
                        },
                        total: {
                            type: "integer",
                            example: 100,
                        },
                    },
                },
                AnimePage: {
                    type: "object",
                    properties: {
                        pageInfo: {
                            $ref: "#/components/schemas/AniListPageInfo",
                        },

                        media: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/Anime",
                            },
                        },
                    },
                },
                AnimeDetails: {
                    allOf: [
                        {
                            $ref: "#/components/schemas/Anime",
                        },
                        {
                            type: "object",
                            properties: {
                                idMal: {
                                    type: "integer",
                                    nullable: true,
                                    example: 20,
                                },

                                description: {
                                    type: "string",
                                    nullable: true,
                                },

                                type: {
                                    type: "string",
                                    example: "ANIME",
                                },

                                endDate: {
                                    $ref: "#/components/schemas/AnimeStartDate",
                                },

                                season: {
                                    type: "string",
                                    nullable: true,
                                    example: "FALL",
                                },

                                seasonYear: {
                                    type: "integer",
                                    nullable: true,
                                    example: 2002,
                                },

                                duration: {
                                    type: "integer",
                                    nullable: true,
                                    example: 23,
                                },

                                countryOfOrigin: {
                                    type: "string",
                                    nullable: true,
                                    example: "JP",
                                },

                                isAdult: {
                                    type: "boolean",
                                    example: false,
                                },

                                meanScore: {
                                    type: "number",
                                    nullable: true,
                                    example: 85,
                                },

                                studios: {
                                    type: "object",
                                    properties: {
                                        edges: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    isMain: {
                                                        type: "boolean",
                                                        example: true,
                                                    },
                                                    node: {
                                                        type: "object",
                                                        properties: {
                                                            id: {
                                                                type: "integer",
                                                                example: 11,
                                                            },
                                                            name: {
                                                                type: "string",
                                                                example:
                                                                    "Pierrot",
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },

                                characters: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            edges: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        role: {
                                                            type: "string",
                                                            example: "MAIN",
                                                        },
                                                        nodes: {
                                                            type: "object",
                                                            properties: {
                                                                id: {
                                                                    type: "integer",
                                                                },
                                                                name: {
                                                                    type: "object",
                                                                    properties:
                                                                        {
                                                                            full: {
                                                                                type: "string",
                                                                            },
                                                                            native: {
                                                                                type: "string",
                                                                                nullable: true,
                                                                            },
                                                                        },
                                                                },
                                                                image: {
                                                                    type: "object",
                                                                    properties:
                                                                        {
                                                                            large: {
                                                                                type: "string",
                                                                                nullable: true,
                                                                                format: "uri",
                                                                            },
                                                                        },
                                                                },
                                                            },
                                                        },
                                                        voiceActors: {
                                                            type: "array",
                                                            items: {
                                                                type: "object",
                                                                properties: {
                                                                    id: {
                                                                        type: "integer",
                                                                    },
                                                                    name: {
                                                                        type: "object",
                                                                        properties:
                                                                            {
                                                                                full: {
                                                                                    type: "string",
                                                                                },
                                                                                native: {
                                                                                    type: "string",
                                                                                    nullable: true,
                                                                                },
                                                                            },
                                                                    },
                                                                    image: {
                                                                        type: "object",
                                                                        properties:
                                                                            {
                                                                                large: {
                                                                                    type: "string",
                                                                                    nullable: true,
                                                                                    format: "uri",
                                                                                },
                                                                            },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        },
    },
    apis: ["./src/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
