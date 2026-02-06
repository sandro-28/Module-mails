"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CampaignStatus } from "@/types/campaign";

interface CampaignFilters {
  status?: CampaignStatus;
  search?: string;
  page?: number;
  perPage?: number;
}

export function useCampaigns(organizationId: string, filters?: CampaignFilters) {
  return useQuery({
    queryKey: ["campaigns", organizationId, filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("campaigns")
        .select("*", { count: "exact" })
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const page = filters?.page || 1;
      const perPage = filters?.perPage || 20;
      const from = (page - 1) * perPage;
      query = query.range(from, from + perPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data || [], total: count || 0 };
    },
  });
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, email_templates(*)")
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
