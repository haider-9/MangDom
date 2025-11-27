"use server";
import axios from "axios";

export async function getMangaData(mangaName) {
  try {
    const response = await axios.get("https://kitsu.io/api/edge/manga", {
      params: {
        "filter[text]": mangaName,
        "page[limit]": 1,
        "fields[manga]":
          "canonicalTitle,coverImage,startDate,endDate,averageRating,synopsis,chapterCount,volumeCount,titles,posterImage,status,ageRating,slug",
      },
    });
    return response.data.data[0];
  } catch (error) {
    console.error("Error fetching manga data:", error);
    return null;
  }
}

export async function getMangaByGenre(genre, limit = 14) {
  try {
    const response = await axios.get("https://kitsu.io/api/edge/manga", {
      params: {
        sort: "-userCount",
        "filter[genres]": genre,
        "page[limit]": limit,
        "fields[manga]":
          "titles,coverImage,posterImage,averageRating,synopsis,chapterCount,startDate,slug",
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching manga by genre:", error);
    return null;
  }
}

export async function getMangaCharacters(mangaId) {
  try {
    const mangaCharacters = await axios.get(
      `https://kitsu.io/api/edge/manga/${mangaId}/characters`,
      {
        params: {
          sort: "role",
          "page[limit]": 20,
          "fields[characters]": "id",
        },
      }
    );

    const promises = [];
    for (const character of mangaCharacters.data.data) {
      promises.push(
        axios.get(
          `https://kitsu.io/api/edge/media-characters/${character.id}/character`,
          {
            params: {
              "fields[characters]":
                "slug,names,canonicalName,malId,image",
            },
          }
        )
      );
    }
    const characterResponse = await Promise.all(promises);
    const characters = characterResponse.map(
      (character) => character.data.data
    );
    return characters;
  } catch (error) {
    console.error("Error fetching character data:", error);
    return null;
  }
}

export async function getTrendingManga() {
  try {
    const response = await axios.get(
      "https://kitsu.io/api/edge/trending/manga",
      {
        params: {
          limit: 10,
          "fields[manga]":
            "canonicalTitle,coverImage,startDate,averageRating,posterImage,chapterCount",
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching trending manga:", error);
    return null;
  }
}

// MangaDex Server Actions
export async function findMangaBySlug(slug) {
  try {
    // Convert slug to search term (e.g., "one-piece" -> "one piece")
    const searchTerm = slug.replace(/-/g, " ");
    const searchUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(searchTerm)}&limit=10&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includes[]=cover_art&includes[]=author&order[relevance]=desc`;
    
    console.log("Searching for manga:", searchTerm);
    
    const response = await axios.get(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.data.data && response.data.data.length > 0) {
      // Try to find exact match first
      const exactMatch = response.data.data.find(
        (manga) =>
          manga.attributes.title.en?.toLowerCase() === searchTerm.toLowerCase() ||
          Object.values(manga.attributes.title).some(
            (title) => title?.toLowerCase() === searchTerm.toLowerCase()
          )
      );

      if (exactMatch) {
        console.log("Found exact match:", exactMatch.attributes.title.en, "ID:", exactMatch.id);
        return exactMatch;
      }
      
      // Return first result if no exact match
      console.log("Using first result:", response.data.data[0].attributes.title.en, "ID:", response.data.data[0].id);
      return response.data.data[0];
    }

    throw new Error("Manga not found");
  } catch (error) {
    console.error("Error in findMangaBySlug:", error);
    throw error;
  }
}

export async function getMangaChapters(mangaId) {
  try {
    // Build URL with proper query parameters for MangaDex API
    const url = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[volume]=asc&order[chapter]=asc&limit=500&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
    
    console.log("Fetching chapters for manga:", mangaId);
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log("Total chapters received:", response.data.data?.length || 0);

    if (!response.data.data || response.data.data.length === 0) {
      throw new Error("No chapters found from API");
    }

    // Log first few chapters for debugging
    if (response.data.data.length > 0) {
      console.log("Sample chapter:", {
        id: response.data.data[0].id,
        chapter: response.data.data[0].attributes.chapter,
        pages: response.data.data[0].attributes.pages,
        title: response.data.data[0].attributes.title
      });
    }

    // Filter to get only chapters with data - be more lenient
    const validChapters = response.data.data.filter(
      (chapter) => {
        const hasPages = chapter.attributes.pages > 0;
        const hasChapterNumber = chapter.attributes.chapter !== null && chapter.attributes.chapter !== undefined;
        return hasPages && hasChapterNumber;
      }
    );

    console.log("Valid chapters after filtering:", validChapters.length);

    if (validChapters.length === 0) {
      // Log why chapters were filtered out
      const withoutPages = response.data.data.filter(ch => ch.attributes.pages === 0).length;
      const withoutChapterNum = response.data.data.filter(ch => !ch.attributes.chapter).length;
      
      console.log("Chapters without pages:", withoutPages);
      console.log("Chapters without chapter number:", withoutChapterNum);
      
      // If we have chapters but they don't have pages, it might be a licensed manga
      if (response.data.data.length > 0) {
        throw new Error("This manga may not have readable chapters available on MangaDex. It might be a licensed series.");
      }
      
      throw new Error("No readable chapters found");
    }

    return validChapters;
  } catch (error) {
    console.error("Error fetching manga chapters:", error.message);
    console.error("MangaId:", mangaId);
    throw error;
  }
}

export async function getChapterPages(chapterId) {
  try {
    const response = await axios.get(
      `https://api.mangadex.org/at-home/server/${chapterId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.data.chapter) {
      throw new Error("Chapter pages not found");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching chapter pages:", error);
    throw error;
  }
}
