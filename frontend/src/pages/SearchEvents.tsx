import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { EventCard } from "../components/ui/event-card";
import { useEventSearch } from "../hooks/useEventSearch";

export default function SearchEvents() {
  const [searchParams] = useSearchParams();

  const params = useMemo(
    () => ({
      query: searchParams.get("q") ?? "",
      location: searchParams.get("loc") ?? "",
      category: searchParams.get("category") ?? "",
    }),
    [searchParams],
  );

  const { data, loading, error } = useEventSearch({
    query: params.query,
    location: params.location,
    category: params.category,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-neutral-900">
        Search results
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Query: {params.query || "(empty)"} · Location: {params.location || "(empty)"}
        {params.category ? (
          <>
            {" "}
            · Category: <span className="font-medium text-neutral-800">{params.category}</span>
          </>
        ) : null}
      </p>

      {loading ? (
        <p className="mt-8 text-neutral-600">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-red-700" role="alert">
          {error}
        </p>
      ) : data && data.length === 0 ? (
        <p className="mt-8 text-neutral-600">No events found.</p>
      ) : data ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event) => (
            <li key={event.id}>
              <EventCard
                id={event.id}
                title={event.title}
                date={event.date}
                location={event.location}
                imageUrl={event.imageUrl}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
