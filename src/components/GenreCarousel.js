"use client";
import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const GenreCarousel = ({ genre, data }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    slidesToScroll: 2,
    containScroll: "trimSnaps",
    align: "center",
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div>
      <style jsx global>{`
        .card-container {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-container:hover {
          transform: scale(1.05);
          width: 400px;
          height: 250px;
          z-index: 10;
        }
        .card-container:hover .banner,
        .card-container:hover .info {
          opacity: 1;
        }
        .banner,
        .poster,
        .info {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className="flex items-center justify-between p-4">
        <h2 className="text-3xl font-semibold">{genre}</h2>
        <div className="flex space-x-2">
          <button
            className={`p-2 bg-secondary text-secondary-foreground rounded-full shadow-lg transition-opacity duration-300 ${
              !prevBtnEnabled ? "opacity-50" : "hover:bg-secondary/80"
            }`}
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
          >
            <ChevronLeft />
          </button>
          <button
            className={`p-2 bg-secondary text-secondary-foreground rounded-full shadow-lg transition-opacity duration-300 ${
              !nextBtnEnabled ? "opacity-50" : "hover:bg-secondary/80"
            }`}
            onClick={scrollNext}
            disabled={!nextBtnEnabled}
          >
            <ChevronRight className="transform transition-transform duration-300 hover:scale-110" />
          </button>
        </div>
      </div>

      <div className="embla__viewport overflow-hidden" ref={emblaRef}>
        <div className="flex items-center gap-6 p-8">
          {data?.map((manga) => (
            <Link
              href={`/manga/${(
                manga?.attributes?.slug
              ).replace(/\s+/g, "-")}`}
              key={manga.id}
              className="card-container relative flex-none w-60 h-80 rounded-lg shadow-lg overflow-hidden cursor-pointer"
            >
              <Image
                src={manga?.attributes?.posterImage?.original}
                alt={manga?.attributes?.canonicalTitle || `banner`}
                width={300}
                height={450}
                className="poster absolute top-0 left-0 w-full h-full object-cover"
              />
              <Image
                src={
                  manga?.attributes?.coverImage?.original ||
                  manga?.attributes?.posterImage?.original
                }
                alt={`${manga?.attributes?.canonicalTitle}` || `Banner`}
                width={400}
                height={250}
                className="banner absolute top-0 left-0 w-full h-full object-cover opacity-0"
              />
              <div className="info absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background to-transparent text-foreground opacity-0">
                <h3 className="text-lg font-bold">
                  {manga?.attributes?.titles?.en ||
                    manga?.attributes?.canonicalTitle}
                </h3>
                <p className="text-sm flex items-center gap-1">
                  <Star className="fill-accent stroke-none" />
                  {manga?.attributes?.averageRating || "N/A"}
                </p>
              </div>
            </Link>
          ))}

          <Link
            href={`genre/${genre}`}
            className="m-2 p-3 bg-secondary text-secondary-foreground rounded-full shadow-lg transition-opacity duration-300 "
          >
            <ChevronRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GenreCarousel;
