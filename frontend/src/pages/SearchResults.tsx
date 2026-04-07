import { useSearchParams } from "react-router";

/**
 * Placeholder route for category and search flows.
 * Query params (e.g. `?category=`) will drive filtering once the page is implemented.
 */
export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Search results</h1>
      {category ? (
        <p className="mt-2 text-sm text-neutral-500">
          Category filter: <span className="font-medium text-neutral-700">{category}</span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-neutral-500">Results will appear here.</p>
      )}
    </div>
  );
}
