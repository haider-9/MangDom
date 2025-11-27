import Link from "next/link";


const getSearchResults = async (query) => {
  try {
   
    const response = await fetch(
      `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data?.data || [];
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
};
const SearchPage = async ({ params }) => {
  const { name } = params; // Extract query from the route params
  const results = await getSearchResults(name);

  if (!results.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">No results found for "{name}".</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-6xl font-bangers tracking-wide font-semibold">
          Search Results for "{name}"
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          {results.map((item) => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-green-500/30 to-yellow-500/30 p-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-md"
              style={{
                backgroundImage: `url(${item.attributes.coverImage?.original || "/cover_placeholder.jpeg"})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <Link
                href={`/manga/${item.attributes.slug}`}
                className="flex flex-col items-center"
              >
                <img
                  src={
                    item.attributes.posterImage?.original ||
                    "/cover_placeholder.jpeg"
                  }
                  alt={`${item.attributes.canonicalTitle} Poster`}
                  width={200}
                  height={300}
                  className="w-full max-w-[150px] aspect-[9/16] rounded-2xl shadow-xl object-cover"
                />
                <h2 className="text-lg font-semibold mt-2 text-center">
                  {item.attributes.canonicalTitle || "Untitled"}
                </h2>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
