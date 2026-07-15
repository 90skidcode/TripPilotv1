import { useState, useEffect, useCallback } from "react";
import { masterDataApi } from "@/lib/api";

interface MasterDataItem {
  id: number;
  category: string;
  key: string;
  label: string;
  description?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMasterData(category?: string) {
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await masterDataApi.list(category);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch master data");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
}

export function useMasterDataByCategory(category: string) {
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await masterDataApi.getByCategory(category);
        setData(result || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch master data");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [category]);

  return {
    data,
    loading,
    error,
  };
}

// Convert master data to dropdown options format
export function toDropdownOptions(items: MasterDataItem[]) {
  return items.map((item) => ({
    value: item.key,
    label: item.label,
  }));
}

// Get label from key using master data
export function getLabelFromKey(
  items: MasterDataItem[],
  key: string,
  fallback: string = key
): string {
  const item = items.find((i) => i.key === key);
  return item?.label || fallback;
}

// Convert to Record<key, label> for easy lookup
export function toLabelMap(items: MasterDataItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  items.forEach((item) => {
    map[item.key] = item.label;
  });
  return map;
}

// Get array of keys for dropdowns
export function getKeys(items: MasterDataItem[]): string[] {
  return items.map((item) => item.key);
}
