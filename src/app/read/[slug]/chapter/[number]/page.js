"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Loading from "@/Loading";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findMangaBySlug, getMangaChapters, getChapterPages } from "@/lib/actions";

// Component to display manga chapter images
const ChapterContent = ({ chapterImages, dataSaver = false, readingDirection = "vertical" }) => {
  const [loadedImages, setLoadedImages] = useState([]);

  const handleImageLoad = (index) => {
    setLoadedImages((prev) => [...prev, index]);
  };

  // Determine layout based on reading direction
  const getContainerClass = () => {
    switch (readingDirection) {
      case "horizontal":
        return "flex overflow-x-auto snap-x snap-mandatory scrollbar-thin";
      case "rtl":
        return "flex flex-row-reverse overflow-x-auto snap-x snap-mandatory scrollbar-thin";
      default:
        return "flex flex-col items-center";
    }
  };

  const getImageClass = () => {
    switch (readingDirection) {
      case "horizontal":
      case "rtl":
        return "flex-shrink-0 snap-center h-screen w-auto";
      default:
        return "w-full h-auto";
    }
  };

  return (
    <div className="mb-8">
      <div className={getContainerClass()}>
        {chapterImages.map((image, index) => (
          <div
            key={index}
            className={`${
              readingDirection === "vertical" ? "mb-4 w-full max-w-3xl" : ""
            } relative`}
          >
            {!loadedImages.includes(index) && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="animate-pulse">
                  Loading image {index + 1}...
                </div>
              </div>
            )}
            <Image
              src={image}
              alt={`Page ${index + 1}`}
              width={dataSaver ? 800 : 1200}
              height={dataSaver ? 1200 : 1800}
              className={getImageClass()}
              priority={index < 3}
              onLoad={() => handleImageLoad(index)}
              unoptimized={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ChapterNavigation = ({
  prevChapter,
  nextChapter,
  mangaSlug,
  currentChapter,
  mangaTitle,
  allChapters,
}) => {
  const currentIndex = allChapters.findIndex(
    (ch) => ch.attributes.chapter === currentChapter
  );

  return (
    <div className="my-8 bg-background p-4 rounded-lg border shadow-lg z-10">
      <div className="flex justify-center mb-2">
        <span className="text-sm text-muted-foreground">
          {mangaTitle} - Chapter {currentChapter}
        </span>
      </div>

      <Pagination>
        <PaginationContent>
          {prevChapter ? (
            <PaginationItem>
              <PaginationPrevious
                href={`/read/${mangaSlug}/chapter/${prevChapter}`}
              />
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className="pointer-events-none opacity-50"
              />
            </PaginationItem>
          )}

          {/* Previous chapters */}
          {currentIndex > 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Show nearby chapters */}
          {allChapters
            .slice(Math.max(0, currentIndex - 1), currentIndex)
            .map((chapter) => (
              <PaginationItem key={chapter.id}>
                <PaginationLink
                  href={`/read/${mangaSlug}/chapter/${chapter.attributes.chapter}`}
                >
                  {chapter.attributes.chapter}
                </PaginationLink>
              </PaginationItem>
            ))}

          {/* Current chapter */}
          <PaginationItem>
            <PaginationLink isActive>{currentChapter}</PaginationLink>
          </PaginationItem>

          {/* Next chapters */}
          {allChapters
            .slice(currentIndex + 1, currentIndex + 2)
            .map((chapter) => (
              <PaginationItem key={chapter.id}>
                <PaginationLink
                  href={`/read/${mangaSlug}/chapter/${chapter.attributes.chapter}`}
                >
                  {chapter.attributes.chapter}
                </PaginationLink>
              </PaginationItem>
            ))}

          {currentIndex + 2 < allChapters.length && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {nextChapter ? (
            <PaginationItem>
              <PaginationNext
                href={`/read/${mangaSlug}/chapter/${nextChapter}`}
              />
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationNext
                href="#"
                className="pointer-events-none opacity-50"
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>

      <div className="flex justify-center mt-2">
        <Button asChild variant="outline">
          <Link href={`/manga/${mangaSlug}`}>Back to Details</Link>
        </Button>
      </div>
    </div>
  );
};

const ReaderSettings = ({
  dataSaver,
  setDataSaver,
  readingDirection,
  setReadingDirection,
  allChapters,
  currentChapter,
  mangaSlug,
}) => {
  const router = useRouter();

  const handleChapterChange = (chapterNumber) => {
    router.push(`/read/${mangaSlug}/chapter/${chapterNumber}`);
  };

  return (
    <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b mb-6">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left side - Chapter selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="chapter-select" className="text-sm font-medium">
              Chapter:
            </Label>
            <Select value={currentChapter} onValueChange={handleChapterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allChapters.map((chapter) => (
                  <SelectItem
                    key={chapter.id}
                    value={chapter.attributes.chapter}
                  >
                    Chapter {chapter.attributes.chapter}
                    {chapter.attributes.title && ` - ${chapter.attributes.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right side - Settings */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="data-saver"
                checked={dataSaver}
                onCheckedChange={setDataSaver}
              />
              <Label htmlFor="data-saver" className="text-sm">
                Data Saver
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="reading-direction" className="text-sm">
                Direction:
              </Label>
              <Select value={readingDirection} onValueChange={setReadingDirection}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="rtl">Right to Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const [mangaData, setMangaData] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [chapterImages, setChapterImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [readingDirection, setReadingDirection] = useState("vertical");
  const [allChapters, setAllChapters] = useState([]);
  const contentRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);



  useEffect(() => {
    async function fetchChapterFromMangaDex() {
      try {
        setLoading(true);

        // Step 1: Find the manga by slug using server action
        const manga = await findMangaBySlug(params.slug);
        const mangaId = manga.id;

        // Get manga title and cover
        const title =
          manga.attributes.title.en || Object.values(manga.attributes.title)[0];

        let coverFileName = null;
        const coverArt = manga.relationships.find(
          (rel) => rel.type === "cover_art"
        );
        if (coverArt) {
          coverFileName = coverArt.attributes?.fileName;
        }

        const coverUrl = coverFileName
          ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}`
          : null;

        setMangaData({
          id: mangaId,
          title,
          coverUrl,
        });

        // Step 2: Get chapters for this manga using server action
        const validChapters = await getMangaChapters(mangaId);

        // Store all chapters for pagination
        setAllChapters(validChapters);

        // Find the requested chapter
        const chapterNumber = params.number;
        const chapterIndex = validChapters.findIndex(
          (chapter) => chapter.attributes.chapter === chapterNumber
        );

        if (chapterIndex === -1) {
          // If chapter not found, redirect to the first chapter
          const firstChapter = validChapters[0].attributes.chapter;
          router.replace(`/read/${params.slug}/chapter/${firstChapter}`);
          return;
        }

        const chapter = validChapters[chapterIndex];
        const chapterId = chapter.id;

        // Get previous and next chapter numbers
        const prevChapter =
          chapterIndex > 0
            ? validChapters[chapterIndex - 1].attributes.chapter
            : null;

        const nextChapter =
          chapterIndex < validChapters.length - 1
            ? validChapters[chapterIndex + 1].attributes.chapter
            : null;

        setChapterData({
          id: chapterId,
          title: chapter.attributes.title || `Chapter ${chapterNumber}`,
          number: chapterNumber,
          prevChapter,
          nextChapter,
          volume: chapter.attributes.volume,
          pages: chapter.attributes.pages,
        });

        // Step 3: Get chapter pages using server action
        const pagesData = await getChapterPages(chapterId);

        // Create full image URLs
        const baseUrl = pagesData.baseUrl;
        const chapterHash = pagesData.chapter.hash;

        // Choose between data-saver and regular quality
        const imageQuality = dataSaver ? "data-saver" : "data";
        const pageFilenames = dataSaver
          ? pagesData.chapter.dataSaver
          : pagesData.chapter.data;

        const imageUrls = pageFilenames.map(
          (filename) => `${baseUrl}/${imageQuality}/${chapterHash}/${filename}`
        );

        setChapterImages(imageUrls);
      } catch (error) {
        console.error("Error fetching chapter:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchChapterFromMangaDex();
  }, [params.slug, params.number, dataSaver, router, retryCount]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !chapterData) {
    const isLicensedError = error?.includes("licensed") || error?.includes("not have readable chapters");
    
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-screen">
        <div className="max-w-2xl w-full">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-3xl font-bold text-center mb-4">
            {isLicensedError ? "Content Not Available" : "Chapter Not Found"}
          </h1>

          {/* Error Message */}
          <div className="bg-card border rounded-xl p-6 mb-6">
            <p className="text-center text-lg mb-4">
              {error || "Chapter not found"}
            </p>
            
            {isLicensedError && (
              <>
                <div className="bg-muted rounded-lg p-4 mt-4">
                  <h3 className="font-semibold mb-2">Why is this happening?</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                    <li>This manga is officially licensed and not available for reading on MangaDex</li>
                    <li>Publishers have requested removal of scanlations</li>
                    <li>Chapters may be available through official sources</li>
                  </ul>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Read Officially
                  </h3>
                  <div className="space-y-2">
                    <a 
                      href="https://www.viz.com/shonenjump" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-background hover:bg-accent rounded-lg transition-colors group"
                    >
                      <div>
                        <div className="font-medium">Viz Media / Shonen Jump</div>
                        <div className="text-xs text-muted-foreground">Official English translations</div>
                      </div>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                    
                    <a 
                      href="https://mangaplus.shueisha.co.jp/updates" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-background hover:bg-accent rounded-lg transition-colors group"
                    >
                      <div>
                        <div className="font-medium">MANGA Plus by SHUEISHA</div>
                        <div className="text-xs text-muted-foreground">Free official chapters</div>
                      </div>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>

                    <a 
                      href="https://www.crunchyroll.com/comics/manga" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-background hover:bg-accent rounded-lg transition-colors group"
                    >
                      <div>
                        <div className="font-medium">Crunchyroll Manga</div>
                        <div className="text-xs text-muted-foreground">Subscription service</div>
                      </div>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isLicensedError && (
              <Button onClick={handleRetry} size="lg">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Loading
              </Button>
            )}
            <Button asChild size="lg" variant={isLicensedError ? "default" : "secondary"}>
              <Link href={`/manga/${params.slug}`}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Manga Details
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home
              </Link>
            </Button>
          </div>

          {/* Additional Help */}
          {isLicensedError ? (
            <div className="mt-8 p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <h4 className="font-semibold mb-2 text-center">Try These Available Manga</h4>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Many manga are available to read on MangaDex. Here are some popular ones:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/manga/komi-cant-communicate" className="px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded-full text-sm transition-colors">
                  Komi Can't Communicate
                </Link>
                <Link href="/manga/spy-x-family" className="px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded-full text-sm transition-colors">
                  Spy x Family
                </Link>
                <Link href="/manga/chainsaw-man" className="px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded-full text-sm transition-colors">
                  Chainsaw Man
                </Link>
                <Link href="/manga/jujutsu-kaisen" className="px-3 py-1 bg-primary/20 hover:bg-primary/30 rounded-full text-sm transition-colors">
                  Jujutsu Kaisen
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Having trouble? This could be due to network issues, API rate limiting, 
                or temporary unavailability. Try a different manga or check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" ref={contentRef}>
      <ReaderSettings
        dataSaver={dataSaver}
        setDataSaver={setDataSaver}
        readingDirection={readingDirection}
        setReadingDirection={setReadingDirection}
        allChapters={allChapters}
        currentChapter={chapterData.number}
        mangaSlug={params.slug}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center">
          {mangaData?.title} - {chapterData.title}
        </h1>
        <p className="text-center text-sm text-muted-foreground mt-1">
          Page 1 of {chapterImages.length}
        </p>
      </div>

      <ChapterContent
        chapterImages={chapterImages}
        dataSaver={dataSaver}
        readingDirection={readingDirection}
      />

      <ChapterNavigation
        prevChapter={chapterData.prevChapter}
        nextChapter={chapterData.nextChapter}
        mangaSlug={params.slug}
        currentChapter={chapterData.number}
        mangaTitle={mangaData?.title}
        allChapters={allChapters}
      />

      {/* Reading progress */}
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm">
            {chapterImages.length > 0
              ? `Chapter ${chapterData.number} • ${chapterImages.length} Pages`
              : "Loading pages..."}
          </div>
        </div>
      </div>
    </div>
  );
}
