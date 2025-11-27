"use client"
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import Loading from '@/Loading'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import Image from 'next/image'

const getMangaByGenreExtended = async (slug, page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `https://kitsu.io/api/edge/manga?sort=-userCount&filter[genres]=${slug}&page[limit]=${limit}&page[offset]=${(page - 1) * limit}&fields[manga]=titles,coverImage,posterImage,averageRating,synopsis,chapterCount,startDate,slug`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch manga data')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching manga by genre:", error)
    return null
  }
}

const GenrePage = ({ params }) => {
  const { genreslug } = React.use(params)
  const [currentPage, setCurrentPage] = useState(1)
  const [mangaData, setMangaData] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await getMangaByGenreExtended(genreslug, currentPage)
        if (result) {
          setMangaData(result.data || [])
          setMeta(result.meta || { count: 0 })
          setError(null)
        } else {
          setError('Failed to load manga data')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [genreslug, currentPage])

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Error: {error}</h1>
      </div>
    )
  }

  const totalPages = meta ? Math.ceil(meta.count / 20) : 1

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const formatGenreName = (slug) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 sm:mb-12 text-center tracking-tight">
        {formatGenreName(genreslug)} Manga
      </h1>

      {mangaData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No manga found in this genre</p>
        </div>
      ) : (
        <>
          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
              {mangaData.map((manga) => {
                const title = manga.attributes.titles.en ||
                  manga.attributes.titles.en_jp ||
                  Object.values(manga.attributes.titles)[0]
                const coverImage = manga.attributes.coverImage?.original || "/cover_placeholder.jpeg"
                const posterImage = manga.attributes.posterImage?.original || "/cover_placeholder.jpeg"

                return (
                  <div
                    key={manga.id}
                    className="relative rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-[350px]"
                  >
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{
                        backgroundImage: `url(${coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(8px) brightness(0.7)',
                        transform: 'scale(1.1)',
                      }}
                    ></div>

                    <div className="relative z-10 h-full p-4 flex flex-col items-center justify-center backdrop-blur-[2px]">
                      <Link
                        href={`/manga/${manga.attributes.slug}`}
                        className="flex flex-col items-center w-full h-full"
                      >
                        <Image
                          src={posterImage}
                          alt={title}
                          width={200}
                          height={300}
                          className="w-full max-w-[150px] aspect-[9/16] rounded-2xl shadow-xl object-cover"
                          onError={(e) => {
                            e.target.src = "/cover_placeholder.jpeg"
                          }}
                        />
                        <h2 className="text-lg font-semibold mt-2 text-center text-foreground line-clamp-2">
                          {title}
                        </h2>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8 cursor-pointer">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default GenrePage