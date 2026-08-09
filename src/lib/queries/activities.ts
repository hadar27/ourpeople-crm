import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ActivityRecord = {
  id: string;
  name: string;
  type: "חינמית" | "בתשלום";
  price: number;
};

export const activityKeys = {
  all: ["activities"] as const,
  list: () => [...activityKeys.all, "list"] as const,
};

export function useActivities() {
  return useQuery({
    queryKey: activityKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").order("name");
      if (error) throw error;
      return data as ActivityRecord[];
    },
  });
}
