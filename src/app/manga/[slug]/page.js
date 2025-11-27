import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMangaCharacters } from "@/lib/actions";

// Fetch manga data from Kitsu REST API
export async function getMangaData(slug) {
  try {
    // First fetch the manga data
    const mangaResponse = await fetch(
      `https://kitsu.io/api/edge/manga?filter[slug]=${slug}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      }
    );

    const mangaData = await mangaResponse.json();

    if (!mangaData.data || mangaData.data.length === 0) {
      return null;
    }

    const mangaId = mangaData.data[0].id;

    // Fetch genres
    const genresResponse = await fetch(
      `https://kitsu.io/api/edge/manga/${mangaId}/genres`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      }
    );
    const genresData = await genresResponse.json();

    // Fetch categories (which include tags)
    const categoriesResponse = await fetch(
      `https://kitsu.io/api/edge/manga/${mangaId}/categories`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      }
    );
    const categoriesData = await categoriesResponse.json();

    return {
      ...mangaData.data[0],
      genres: genresData.data || [],
      categories: categoriesData.data || [],
    };
  } catch (error) {
    console.error("Error fetching manga data:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const manga = await getMangaData(params.slug);

  if (!manga) {
    return {
      title: "Manga Not Found",
      description: "The requested manga could not be found.",
    };
  }

  const title =
    manga.attributes.canonicalTitle ||
    manga.attributes.titles.en ||
    manga.attributes.titles.en_jp ||
    Object.values(manga.attributes.titles)[0];

  return {
    title: `${title} | Mangadom`,
    description:
      manga.attributes.synopsis?.substring(0, 160) ||
      "Explore this manga on Mangadom",
  };
}

export default async function MangaPage({ params }) {
  const manga = await getMangaData(params.slug);

  if (!manga) {
    notFound();
  }
  const characters = await getMangaCharacters(manga.id);
  if (!characters) {
    notFound();
  }

  const { attributes, genres } = manga;

  const title =
    attributes.canonicalTitle ||
    attributes.titles.en ||
    attributes.titles.en_jp ||
    Object.values(attributes.titles)[0];

  const japaneseTitle = attributes.titles.ja_jp || attributes.titles.ja;

  const description = attributes.synopsis || "No description available";

  const coverUrl =
    attributes.coverImage?.original || attributes.posterImage?.original || null;

  const posterUrl =
    attributes.posterImage?.original || attributes.coverImage?.original || null;

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statusColors = {
    current: "bg-accent",
    finished: "bg-primary",
    tba: "bg-secondary",
    unreleased: "bg-muted",
    upcoming: "bg-secondary",
  };

  const rating = attributes.averageRating
    ? (parseFloat(attributes.averageRating) / 10).toFixed(2)
    : null;

  const formatSlug = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {coverUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={coverUrl}
              alt={`${title} banner`}
              fill
              sizes="100vw"
              className="object-cover object-top"
              priority
              quality={90}
              unoptimized={false}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-900 to-blue-900" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Floating cover on desktop */}
        <div className="hidden md:block absolute -bottom-24 left-10 w-48 h-64 rounded-xl shadow-2xl border-4 border-border overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl">
          {posterUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={posterUrl}
                alt={`${title} cover`}
                fill
                sizes="(max-width: 768px) 100vw, 192px"
                className="object-cover"
                priority
                unoptimized={false}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 relative">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - Mobile cover and metadata */}
          <div className="md:hidden w-full">
            <div className="relative w-32 h-48 mx-auto rounded-lg shadow-lg overflow-hidden">
              {posterUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={posterUrl}
                    alt={`${title} cover`}
                    fill
                    sizes="128px"
                    className="object-cover"
                    unoptimized={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Details */}
          <div className="flex-1">
            {/* Title Section */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
              {japaneseTitle && japaneseTitle !== title && (
                <h2 className="text-xl text-muted-foreground italic">
                  {japaneseTitle}
                </h2>
              )}
            </div>

            {/* Type */}
            <div className="mb-6 flex flex-wrap gap-4 text-sm">
              {attributes.subtype && (
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium capitalize">
                    {attributes.subtype}
                  </span>
                </div>
              )}
            </div>

            {/* Rating and Status Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              {rating && (
                <div className="flex items-center bg-secondary px-3 py-1 rounded-full shadow-sm border border-border">
                  <div className="text-yellow-500 font-bold mr-1">{rating}</div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${
                          i < Math.round(parseFloat(rating))
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              )}

              {attributes.status && (
                <div
                  className={`px-3 py-1 justify-center items-center rounded-full flex text-primary-foreground text-sm font-medium ${
                    statusColors[attributes.status.toLowerCase()] ||
                    "bg-muted"
                  }`}
                >
                  {attributes.status.replace(/_/g, " ")}
                </div>
              )}

              {attributes.ageRating && (
                <div className="px-3 py-1 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                  {attributes.ageRating}
                  {attributes.ageRatingGuide
                    ? ` (${attributes.ageRatingGuide})`
                    : ""}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link href={`/chapters/${attributes.slug}`}>
                <button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Read Now
                </button>
              </Link>
              <button className="flex-1 md:flex-none bg-secondary hover:bg-accent text-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md border border-border">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Bookmark
              </button>
              <button className="flex-1 md:flex-none bg-secondary hover:bg-accent text-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md border border-border">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share
              </button>
            </div>

            {/* Synopsis */}
            <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border border-border">
              <h3 className="text-xl font-semibold mb-4">Synopsis</h3>
              <p className="text-card-foreground leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card p-4 rounded-xl shadow-sm border border-border text-center">
                <div className="text-muted-foreground text-sm mb-1">Rating</div>
                <div className="text-2xl font-bold">{rating || "-"}</div>
              </div>
              <div className="bg-card p-4 rounded-xl shadow-sm border border-border text-center">
                <div className="text-muted-foreground text-sm mb-1">
                  Chapters
                </div>
                <div className="text-2xl font-bold">
                  {attributes.chapterCount || "Ongoing"}
                </div>
              </div>
              <div className="bg-card p-4 rounded-xl shadow-sm border border-border text-center">
                <div className="text-muted-foreground text-sm mb-1">
                  Published
                </div>
                <div className="text-lg font-medium">
                  {formatDate(attributes.startDate)}
                </div>
              </div>
              <div className="bg-card p-4 rounded-xl shadow-sm border border-border text-center">
                <div className="text-muted-foreground text-sm mb-1">
                  Volumes
                </div>
                <div className="text-lg font-medium">
                  {attributes.volumeCount || "Ongoing"}
                </div>
              </div>
            </div>

            {/* Characters */}
            <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border border-border">
              <h3 className="text-xl font-semibold mb-4">Characters</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {characters?.map((character) => (
                  <Link
                    href={`/character/${character.id}`}
                    key={character.id}
                    className="group"
                  >
                    <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      {/* Character Image */}
                      <div className="relative aspect-[3/4]">
                        {character.attributes?.image?.original ? (
                          <Image
                            src={character.attributes.image.original}
                            alt={character.attributes.canonicalName}
                            fill
                            sizes="(max-width: 768px) 50vw, 20vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">
                              No Image
                            </span>
                          </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      </div>

                      {/* Character Name */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="text-white font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {character.attributes.canonicalName}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden md:block w-80 flex-shrink-0 space-y-6">
            {/* Cover Art - Desktop */}
            <div className="relative w-full aspect-[2/3] rounded-xl shadow-lg overflow-hidden">
              {posterUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={posterUrl}
                    alt={`${title} cover`}
                    fill
                    sizes="320px"
                    className="object-cover"
                    unoptimized={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
              <h3 className="text-lg font-semibold mb-3">Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-muted-foreground text-sm">Status</div>
                  <div className="font-medium capitalize">
                    {attributes.status?.replace(/_/g, " ") || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">
                    Age Rating
                  </div>
                  <div className="font-medium">
                    {attributes.ageRating || "Unknown"}
                    {attributes.ageRatingGuide && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({attributes.ageRatingGuide})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Type</div>
                  <div className="font-medium capitalize">
                    {attributes.subtype || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">
                    Chapter Count
                  </div>
                  <div className="font-medium">
                    {attributes.chapterCount || "Ongoing"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">
                    Volume Count
                  </div>
                  <div className="font-medium">
                    {attributes.volumeCount || "Ongoing"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">
                    Start Date
                  </div>
                  <div className="font-medium">
                    {formatDate(attributes.startDate)}
                  </div>
                </div>
                {attributes.endDate && (
                  <div>
                    <div className="text-muted-foreground text-sm">
                      End Date
                    </div>
                    <div className="font-medium">
                      {formatDate(attributes.endDate)}
                    </div>
                  </div>
                )}
                {genres.length > 0 && (
                  <div>
                    <div className="text-muted-foreground text-sm">Genres</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {genres.map((genre) => (
                        <Link
                          key={genre.id}
                          href={`/genre/${formatSlug(genre.attributes.name)}`}
                          className="text-xs bg-secondary hover:bg-accent text-foreground px-2 py-1 rounded transition-colors duration-200"
                        >
                          {genre.attributes.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
