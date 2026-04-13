"use client";

import { DependencyList, useEffect, useState } from "react";

interface AsyncResourceState<T> {
  data: T | null;
  error: string;
  isLoading: boolean;
}

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  dependencies: DependencyList
): AsyncResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError("");

    loader()
      .then((nextData) => {
        if (!isActive) {
          return;
        }

        setData(nextData);
      })
      .catch((nextError) => {
        if (!isActive) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load data.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, dependencies);

  return { data, error, isLoading };
}
