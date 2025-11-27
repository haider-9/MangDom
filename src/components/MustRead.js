import Image from "next/image";
import { Bookmark, EyeIcon, LucideThumbsUp, Star } from "lucide-react";
import { getMangaData } from "@/lib/actions";
import Link from "next/link";
import { mustRead } from "@/constants";

const promises = mustRead.map(manga=>getMangaData(manga));
const MustRead = async () => {
  const mangaData = await Promise.all(promises);
  return (
    <section className="py-10 px-3 space-y-8">
      <h2 className="text-3xl font-semibold">Must Read</h2>
      <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
        {mangaData.map((manga, index) => (
          <div
            key={index}
            href="/"
            className="relative overflow-hidden rounded-xl shadow-xl group transition-all duration-300"
            suppressHydrationWarning>
            <Image
              src={
                manga?.attributes?.coverImage?.large ||
                manga?.attributes?.coverImage?.original
              }
              alt={`${manga.attributes.canonicalTitle} Cover`}
              placeholder="blur"
              blurDataURL={manga?.attributes?.coverImage?.tiny}
              width={600}
              height={400}
              className="w-full h-72 object-cover group-hover:scale-105 grayscale-[0.7] group-hover:grayscale-0 transition-all duration-300"
              priority
            />
            <div className="px-6 py-6 w-[75%] max-w-sm absolute top-1/2 left-[5%] -translate-y-1/2 bg-card/90 flex flex-col gap-2">
              <div className="-mb-2 text-sm self-end flex items-center gap-1">
                <Star className="fill-accent stroke-none" />
                {manga.attributes.averageRating || "N/A"}
              </div>
              <h3 className="text-xl md:text-2xl font-bold max-w-[20ch]">
                {manga.attributes.canonicalTitle}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                {manga.attributes.synopsis}
              </p>
              <Link
                href={`/manga/${manga.attributes.slug}`}
                className="p-2 inline-block bg-primary text-primary-foreground rounded-sm self-end">
                Read Now
              </Link>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2 text-primary-foreground">
              <button className="p-2 bg-primary hover:bg-primary/90 rounded-full aspect-square">
                <LucideThumbsUp />
              </button>
              <button className="p-2 bg-primary hover:bg-primary/90 rounded-full aspect-square">
                <EyeIcon />
              </button>
              <button className="p-2 bg-primary hover:bg-primary/90 rounded-full aspect-square">
                <Bookmark />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MustRead;
