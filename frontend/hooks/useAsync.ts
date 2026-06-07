"use client";

import { useEffect, useReducer, useCallback } from "react";

export interface UseAsyncState<T> {
  status: "idle" | "pending" | "success" | "error";
  data: T | null;
  error: Error | null;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
}

type UseAsyncAction<T> =
  | { type: "RESET" }
  | { type: "PENDING" }
  | { type: "SUCCESS"; payload: T }
  | { type: "ERROR"; payload: Error };

function asyncReducer<T>(
  state: UseAsyncState<T>,
  action: UseAsyncAction<T>
): UseAsyncState<T> {
  switch (action.type) {
    case "RESET":
      return { status: "idle", data: null, error: null };
    case "PENDING":
      return { status: "pending", data: null, error: null };
    case "SUCCESS":
      return { status: "success", data: action.payload, error: null };
    case "ERROR":
      return { status: "error", data: null, error: action.payload };
    default:
      return state;
  }
}

/**
 * Hook for managing async operations with loading and error states
 *
 * @example
 * const { data, status, error, execute } = useAsync(async () => {
 *   const res = await fetch('/api/users');
 *   return res.json();
 * }, false);
 *
 * return (
 *   <>
 *     <button onClick={execute}>Load Users</button>
 *     {status === 'pending' && <Spinner />}
 *     {status === 'success' && <UserList users={data} />}
 *     {status === 'error' && <Alert>{error?.message}</Alert>}
 *   </>
 * );
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate: boolean = true
): UseAsyncReturn<T> {
  const [state, dispatch] = useReducer(asyncReducer<T>, {
    status: "idle",
    data: null,
    error: null,
  });

  const execute = useCallback(async () => {
    dispatch({ type: "PENDING" });
    try {
      const data = await asyncFn();
      dispatch({ type: "SUCCESS", payload: data });
    } catch (error) {
      dispatch({
        type: "ERROR",
        payload: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute, reset };
}
