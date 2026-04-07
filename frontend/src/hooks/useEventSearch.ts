import { useCallback, useEffect, useState } from "react";
import {
  searchEvents,
  type SearchEvent,
  type SearchEventsParams,
} from "../services/searchApi";

type UseEventSearchState = {
  data: SearchEvent[] | null;
  loading: boolean;
  error: string | null;
};

/**
 * Encapsulates loading / error handling for search. The page owns URL params;
 * this hook only runs the request when params change.
 */
export function useEventSearch(params: SearchEventsParams) {
  const [state, setState] = useState<UseEventSearchState>({
    data: null,
    loading: false,
    error: null,
  });

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await searchEvents(params);
      setState({ data, loading: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Search failed";
      setState({ data: null, loading: false, error: message });
    }
  }, [params.query, params.location]);

  useEffect(() => {
    void run();
  }, [run]);

  return { ...state, refetch: run };
}
