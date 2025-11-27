import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import axios from "axios";

// Fetch manga ID by slug from Kitsu
async function getMangaIdBySlug(slug) {
    try {
        const response = await axios.get("https://kitsu.io/api/edge/manga", {
            params: {
                filter: { slug },
                fields: { manga: 'id,slug,titles,posterImage' }
            }
        });

        if (!response.data.data || response.data.data.length === 0) {
            return null;
        }

        return {
            id: response.data.data[0].id,
            ...response.data.data[0].attributes
        };
    } catch (error) {
        console.error("Error fetching manga ID from Kitsu:", error);
        return null;
    }
}

// Fetch chapters by manga ID from Kitsu
async function fetchMangaChapters(mangaId) {
    try {
        let allChapters = [];
        let nextUrl = `https://kitsu.io/api/edge/manga/${mangaId}/chapters?page[limit]=20&sort=number`;

        while (nextUrl) {
            const response = await axios.get(nextUrl);
            allChapters = [...allChapters, ...response.data.data];
            nextUrl = response.data.links?.next;
        }

        return allChapters.map(chapter => ({
            id: chapter.id,
            ...chapter.attributes
        }));
    } catch (error) {
        console.error("Error fetching manga chapters from Kitsu:", error);
        return [];
    }
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const mangaData = await getMangaIdBySlug(resolvedParams.slug);

    if (!mangaData) {
        return {
            title: "Manga Not Found",
            description: "The requested manga could not be found.",
        };
    }

    const title = mangaData.titles.en ||
        mangaData.titles.en_jp ||
        Object.values(mangaData.titles)[0] ||
        "Manga";

    return {
        title: `${title} Chapters | Mangadom`,
        description: `Browse all chapters for ${title} on Mangadom`,
    };
}

export default async function MangaChaptersPage({ params }) {
    const resolvedParams = await params;
    const mangaData = await getMangaIdBySlug(resolvedParams.slug);

    if (!mangaData) {
        notFound();
    }

    const chapters = await fetchMangaChapters(mangaData.id);

    // Get title in available language
    const title = mangaData.titles.en ||
        mangaData.titles.en_jp ||
        Object.values(mangaData.titles)[0] ||
        "Manga";
        const sluggedtitle=title.replace(/\s+/g, '-').toLowerCase();

    // Group chapters by volume
    const chaptersByVolume = chapters.reduce((acc, chapter) => {
        const volume = chapter.volume || "none";
        if (!acc[volume]) {
            acc[volume] = [];
        }
        acc[volume].push(chapter);
        return acc;
    }, {});

    // Sort volumes
    const sortedVolumes = Object.keys(chaptersByVolume).sort((a, b) => {
        if (a === "none") return 1;
        if (b === "none") return -1;
        return parseFloat(a) - parseFloat(b);
    });

    return (
        <main className="min-h-screen ">
            {/* Header */}
            <div className=" shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        {mangaData.posterImage && (
                            <div className="relative w-16 h-20 rounded-md overflow-hidden">
                                <Image
                                    src={mangaData.posterImage.medium}
                                    alt={`${title} cover`}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                    unoptimized={false}
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{title}</h1>
                            <h2 className="text-lg text-muted-foreground">All Chapters</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapters List */}
            <div className="container mx-auto px-4 py-8">
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border">
                    {/* Filters */}
                    <div className="p-4 border-b flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Total chapters:</span>
                            <span className="font-medium">{chapters.length}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {Object.keys(chaptersByVolume).length} volumes
                        </div>
                    </div>

                    {/* Volumes and Chapters */}
                    <div className="divide-y">
                        {sortedVolumes.length > 0 ? (
                            sortedVolumes.map((volume) => (
                                <div key={volume} className="p-4">
                                    <h3 className="font-bold mb-3">
                                        {volume === "none" ? "No Volume" : `Volume ${volume}`}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {chaptersByVolume[volume]
                                            .sort((a, b) => parseFloat(a.number) - parseFloat(b.number))
                                            .map((chapter) => (
                                                <Link
                                                    key={chapter.id}
                                                    href={`/read/${sluggedtitle}/chapter/${chapter.number}`}
                                                    className="bg-secondary hover:bg-secondary/80 p-3 rounded-md transition-colors duration-200"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-medium">
                                                                Chapter {chapter.number}
                                                            </h4>
                                                            {chapter.title && (
                                                                <p className="text-sm text-muted-foreground truncate">
                                                                    {chapter.title}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {chapter.language}
                                                        </div>
                                                    </div>
                                                    {chapter.publishedAt && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {new Date(chapter.publishedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </Link>
                                            ))
                                        }
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-muted-foreground">
                                    No chapters available for this manga
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {chapters.length > 0 && (
                        <div className="p-4 border-t flex justify-center">
                            <nav className="flex items-center gap-2">
                                <button className="px-3 py-1 rounded-md border text-sm disabled:opacity-50">
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">Page 1</span>
                                <button className="px-3 py-1 rounded-md border text-sm disabled:opacity-50">
                                    Next
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
