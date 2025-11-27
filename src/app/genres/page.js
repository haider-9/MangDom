"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Loading from "@/Loading"; // Corrected import to match component name

function getGenres(page = 1, limit = 20) {
  return fetch(
    `https://kitsu.io/api/edge/genres?page[limit]=${limit}&page[offset]=${
      (page - 1) * limit
    }`
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch genres");
      }
      return res.json();
    })
    .catch((error) => {
      console.error("Error fetching genres:", error);
      return { data: [], links: {} };
    });
}

async function getRandomAnimeBanner(genreName) {
  try {
    const res = await fetch(
      `https://kitsu.io/api/edge/anime?filter[genres]=${genreName}&page[limit]=1`
    );
    if (!res.ok) {
      throw new Error("Failed to fetch anime banner");
    }
    const data = await res.json();
    return data.data.length > 0
      ? data.data[Math.floor(Math.random() * data.data.length)].attributes.coverImage?.large || null
      : null;
  } catch (error) {
    console.error("Error fetching banner for genre:", genreName, error);
    return null;
  }
}

export default function GenresPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [genresData, setGenresData] = useState({ data: [], links: {} });
  const [banners, setBanners] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialGenres = async () => {
      setIsLoading(true); // Start loading state
      const initialData = await getGenres();
      setGenresData(initialData);

      // Fetch banners for all genres in the initial data
      const bannerPromises = initialData.data.map((genre) =>
        getRandomAnimeBanner(genre.attributes.name).then((banner) => ({
          id: genre.id,
          banner,
        }))
      );

      const resolvedBanners = await Promise.all(bannerPromises);
      const bannerMap = resolvedBanners.reduce(
        (acc, { id, banner }) => ({ ...acc, [id]: banner }),
        {}
      );

      setBanners(bannerMap);
      setIsLoading(false); // End loading state
    };

    fetchInitialGenres();
  }, []);

  const loadMoreGenres = async () => {
    const nextPage = currentPage + 1;
    const newGenresData = await getGenres(nextPage);

    setGenresData((prevData) => ({
      ...newGenresData,
      data: [...prevData.data, ...newGenresData.data],
    }));

    setCurrentPage(nextPage);

    // Fetch banners for the new genres (only if new genres were added)
    const bannerPromises = newGenresData.data.map((genre) =>
      getRandomAnimeBanner(genre.attributes.name).then((banner) => ({
        id: genre.id,
        banner,
      }))
    );

    const resolvedBanners = await Promise.all(bannerPromises);
    const bannerMap = resolvedBanners.reduce(
      (acc, { id, banner }) => ({ ...acc, [id]: banner }),
      {}
    );

    setBanners((prevBanners) => ({ ...prevBanners, ...bannerMap }));
  };

  if (isLoading) {
    return (
      <Loading /> // Corrected loading component usage
    );
  }

  if (genresData.data.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-muted-foreground">
          No genres available.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Anime Genres</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {genresData.data.map((genre) => (
          <Link href={`/genre/${genre.attributes.slug}`} key={genre.id}>
            <div className="relative bg-secondary rounded-lg shadow-lg p-10 overflow-hidden group">
              <img
                src={banners[genre.id] || 'placeholder_image_url'}
                alt={genre.attributes.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-all duration-150 group-hover:scale-105"
              />
              <div className="relative z-10">
                <h2 className="text-3xl font-semibold mb-3 text-foreground">
                  {genre.attributes.name}
                </h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {genresData.links && genresData.links.next && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMoreGenres}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
