  "use client";
  import Image from "next/image";
  import { useEffect, useState, use } from "react";
  import axios from "axios";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Badge } from "@/components/ui/badge";
  import { ScrollArea } from "@/components/ui/scroll-area";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { Button } from "@/components/ui/button";
  import { Separator } from "@/components/ui/separator";
  import { Heart, Share2, ExternalLink, ArrowLeft, X, Download } from "lucide-react";
  import Link from "next/link";
  import { useRouter } from "next/navigation";

  export default function CharacterPage({ params }) {
    const router = useRouter();
    const param = use(params);
    const charID = param.charID;
    const [character, setCharacter] = useState(null);
    const [mediaAppearances, setMediaAppearances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [relatedCharacters, setRelatedCharacters] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
      const fetchCharacter = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `https://kitsu.io/api/edge/characters/${charID}`,
            {
              params: {
                "fields[characters]": "slug,names,canonicalName,malId,image,description,otherNames",
                "include": "mediaCharacters.media"
              },
            }
          );

          const characterData = response.data.data;
          if (characterData.attributes.description === null) {
            characterData.attributes.description = "No description available for this character.";
          }
          setCharacter(characterData);

          // Process included media appearances if available
          if (response.data.included) {
            const mediaData = response.data.included
              .filter(item => item.type === 'manga')
              .map(item => ({
                id: item.id,
                title: item.attributes.canonicalTitle || item.attributes.titles?.en_jp || 'Unknown Title',
                posterImage: item.attributes.posterImage?.medium || '/manga-placeholder.jpg',
                slug: item.attributes.slug
              }));
            setMediaAppearances(mediaData);
          }
        } catch (error) {
          console.error("Error fetching character data:", error);
          setError("Failed to load character data");
        } finally {
          setLoading(false);
        }
      };

      fetchCharacter();
    }, [charID]);

    // Fetch related characters from the same media
    useEffect(() => {
      const fetchRelatedCharacters = async () => {
        if (!character || mediaAppearances.length === 0) return;
        
        setLoadingRelated(true);
        try {
          // Get characters from the first media appearance
          const firstMedia = mediaAppearances[0];
          if (!firstMedia) return;

          const response = await axios.get(
            `https://kitsu.io/api/edge/manga/${firstMedia.id}/characters`,
            {
              params: {
                'page[limit]': 12,
                'fields[characters]': 'slug,names,canonicalName,image',
                'include': 'character'
              }
            }
          );

          if (response.data.included) {
            const characters = response.data.included
              .filter(item => item.type === 'characters' && item.id !== charID)
              .slice(0, 8)
              .map(char => ({
                id: char.id,
                name: char.attributes.canonicalName || char.attributes.names?.en || 'Unknown',
                image: char.attributes.image?.original || char.attributes.image?.medium || '/character-placeholder.jpg',
                slug: char.attributes.slug
              }));
            
            setRelatedCharacters(characters);
          }
        } catch (error) {
          console.error("Error fetching related characters:", error);
        } finally {
          setLoadingRelated(false);
        }
      };

      fetchRelatedCharacters();
    }, [character, mediaAppearances, charID]);

    // Fetch gallery images when gallery tab is accessed
    const fetchGalleryImages = async () => {
      if (galleryImages.length > 0) return; // Already loaded
      
      setLoadingGallery(true);
      try {
        // Collect all available images from character and media appearances
        const images = [];
        
        // Add main character image
        if (character.attributes.image?.original) {
          images.push({
            id: 'main',
            url: character.attributes.image.original,
            title: `${character.attributes.canonicalName} - Main Image`,
            type: 'character'
          });
        }

        // Add different sizes of character image if available
        if (character.attributes.image) {
          const imageVariants = ['large', 'medium', 'small'];
          imageVariants.forEach((variant, index) => {
            if (character.attributes.image[variant] && character.attributes.image[variant] !== character.attributes.image.original) {
              images.push({
                id: `variant-${index}`,
                url: character.attributes.image[variant],
                title: `${character.attributes.canonicalName} - ${variant}`,
                type: 'character'
              });
            }
          });
        }

        // Add images from media appearances
        mediaAppearances.forEach((media, index) => {
          if (media.posterImage) {
            images.push({
              id: `media-${index}`,
              url: media.posterImage,
              title: `From ${media.title}`,
              type: 'media'
            });
          }
        });

        // If we have MAL ID, we could potentially fetch more images
        // For now, we'll use what we have
        
        setGalleryImages(images);
      } catch (error) {
        console.error("Error loading gallery:", error);
      } finally {
        setLoadingGallery(false);
      }
    };

    if (loading) {
      return (
        <div className="min-h-screen p-8">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Image Skeleton */}
              <div className="w-full lg:w-1/3">
                <Skeleton className="w-full aspect-[2/3] rounded-xl" />
              </div>

              {/* Content Skeleton */}
              <div className="w-full lg:w-2/3 space-y-6">
                <Skeleton className="h-12 w-3/4 rounded-lg" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error || !character) {
      return (
        <div className="min-h-screen flex items-center justify-center ">
          <Card className="w-full max-w-md bg-card border">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-destructive">Error Loading Character</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-card-foreground mb-6">{error || "Character not found"}</p>
              <div className="flex gap-4">
                <Button onClick={() => window.location.reload()} variant="default">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const formatDescription = (text) => {
      if (!text) return "No description available.";
      return text.split('\n').map((paragraph, i) => (
        <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
      ));
    };

    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb navigation */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
            {/* Character Image Card */}
            <div className="w-full lg:w-1/3 xl:w-1/4">
              <Card className="bg-card/60 border overflow-hidden">
                <div className="relative group">
                  <Image
                    src={character.attributes.image?.original || "/character-placeholder.jpg"}
                    alt={character.attributes.canonicalName || "Character"}
                    width={400}
                    height={600}
                    className="w-full aspect-[2/3] object-cover object-center h-full
                  "
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>

                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold tracking-wide mb-4">
                    {character.attributes.canonicalName}
                  </h1>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    {character.attributes.names && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Names</h3>
                        {character.attributes.names?.en && (
                          <div>
                            <span className="text-sm text-muted-foreground">English: </span>
                            <span className="text-sm">{character.attributes.names.en}</span>
                          </div>
                        )}
                        {character.attributes.names?.ja_jp && (
                          <div>
                            <span className="text-sm text-muted-foreground">Japanese: </span>
                            <span className="text-sm">{character.attributes.names.ja_jp}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {character.attributes.otherNames?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Also Known As</h3>
                        <div className="flex flex-wrap gap-2">
                          {character.attributes.otherNames.map((name, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-2" /> Favorite
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                  </div>

                  {character.attributes.malId && (
                    <div className="mt-4 pt-4 border-t">
                      <a
                        href={`https://myanimelist.net/character/${character.attributes.malId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" /> View on MyAnimeList
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Character Details */}
            <div className="w-full lg:w-2/3 xl:w-3/4">
              <Tabs defaultValue="about" className="w-full" onValueChange={(value) => {
                if (value === 'gallery') {
                  fetchGalleryImages();
                }
              }}>
                <TabsList className="bg-card/60 border mb-6">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="appearances">Appearances</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                </TabsList>

                <TabsContent value="about">
                  <Card className="bg-card/60 border">
                    <CardHeader>
                      <CardTitle>Character Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                        <div className="prose prose-invert max-w-none">
                          {formatDescription(character.attributes.description)}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="appearances">
                  <Card className="bg-card/60 border">
                    <CardHeader>
                      <CardTitle>Media Appearances</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {mediaAppearances.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {mediaAppearances.map((media) => (
                            <Link href={`/manga/${media.id}`} key={media.id}>
                              <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                {/* Background Image */}
                                <div className="relative h-80">
                                  <Image
                                    src={media.posterImage}
                                    alt={media.title}
                                    fill
                                    className="object-cover"
                                  />
                                  {/* Gradient Overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                </div>
                                
                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                  <h3 className="text-white font-bold text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {media.title}
                                  </h3>
                                  
                                  {/* Action Button */}
                                  <button className="w-full mt-4 bg-white text-black font-semibold py-3 px-6 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform group-hover:scale-105">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground text-lg">No media appearances found for this character.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>              <TabsContent value="gallery">
                  <Card className="bg-card/60 border">
                    <CardHeader>
                      <CardTitle>Character Gallery</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingGallery ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                          ))}
                        </div>
                      ) : galleryImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {galleryImages.map((image) => (
                            <div
                              key={image.id}
                              className="group relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer bg-secondary"
                              onClick={() => setSelectedImage(image)}
                            >
                              <Image
                                src={image.url}
                                alt={image.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-110"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                  <p className="text-white text-xs font-medium line-clamp-2">
                                    {image.title}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground mb-4">No images available in gallery</p>
                          <Button onClick={fetchGalleryImages} variant="outline">
                            Load Gallery
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Image Lightbox Modal */}
                {selectedImage && (
                  <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-white hover:bg-white/20"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                    
                    <div
                      className="relative max-w-5xl max-h-[90vh] w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={selectedImage.url}
                          alt={selectedImage.title}
                          width={1200}
                          height={1800}
                          className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                          priority
                        />
                      </div>
                      
                      <div className="mt-4 bg-card/80 backdrop-blur-sm rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{selectedImage.title}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {selectedImage.type} Image
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={selectedImage.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Tabs>

              {/* Related Characters Section */}
              <Card className="bg-card/60 border mt-6">
                <CardHeader>
                  <CardTitle>Related Characters</CardTitle>
                  {mediaAppearances.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Characters from {mediaAppearances[0].title}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {loadingRelated ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="aspect-[2/3] rounded-lg" />
                          <Skeleton className="h-4 w-full rounded" />
                        </div>
                      ))}
                    </div>
                  ) : relatedCharacters.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {relatedCharacters.map((relatedChar) => (
                        <Link
                          key={relatedChar.id}
                          href={`/character/${relatedChar.id}`}
                          className="group"
                        >
                          <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                            {/* Character Image */}
                            <div className="relative aspect-[2/3]">
                              <Image
                                src={relatedChar.image}
                                alt={relatedChar.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                              />
                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                            </div>
                            
                            {/* Character Name */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h3 className="text-white font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                                {relatedChar.name}
                              </h3>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {mediaAppearances.length === 0
                          ? "No media appearances to find related characters"
                          : "No related characters found"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
