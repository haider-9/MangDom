"use client";
import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import axios from "axios";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { Star } from "lucide-react";
import Link from "next/link";

const Carousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000 }),
  ]);
  const [topManga, setTopManga] = useState([]);

  useEffect(() => {
    const fetchTopManga = async () => {
      try {
        const response = await axios.get("https://kitsu.io/api/edge/manga", {
          params: {
            sort: "-favoritesCount",
            "page[limit]": 10,
            "fields[manga]":
              "canonicalTitle,coverImage,startDate,averageRating,synopsis,serialization,slug",
          },
        });
        setTopManga(response.data.data)        
      } catch (error) {
        console.error("Error fetching top manga:", error);
      }
    };

    fetchTopManga();
  }, []);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  return (
    <div className="relative w-full mx-auto">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex h-[80vh]">
          {topManga.map((manga) => (
            <div
              key={manga.id}
              className="embla__slide flex-shrink-0 w-full h-full relative">
              <Image
                fill
                src={
                  manga.attributes.coverImage?.large ||
                  manga.attributes.coverImage?.original
                }
                alt={manga.attributes.canonicalTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/70 flex items-end">
                <div className="p-6 max-w-3xl text-foreground w-full">
                  <h2 className="text-2xl md:text-4xl tracking-wide font-bold font-bangers space-y-3">
                    <Link href={`/manga/${manga?.attributes?.slug}`}>
                    {manga.attributes.canonicalTitle}
                    </Link>
                  </h2>
                  <p className="mb-2 text-sm text-accent font-bold flex items-center gap-1">
                    <Star className="fill-accent stroke-none" />
                    {manga.attributes.averageRating
                      ? `${(
                          parseFloat(manga.attributes.averageRating) / 10
                        ).toFixed(1)}/10`
                      : "N/A"}
                  </p>
                  <p className="text-base text-pretty mt-2 line-clamp-3 leading-relaxed">
                    {manga.attributes.synopsis}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className="absolute top-1/2 left-6 transform -translate-y-1/2 bg-primary/50 hover:bg-primary/75 text-primary-foreground font-bold py-3 px-5 rounded-full text-2xl"
        onClick={scrollPrev}>
        ‹
      </button>
      <button
        className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-primary/50 hover:bg-primary/75 text-primary-foreground font-bold py-3 px-5 rounded-full text-2xl"
        onClick={scrollNext}>
        ›
      </button>
    </div>
  );
};

export default Carousel;
