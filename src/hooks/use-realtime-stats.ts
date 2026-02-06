"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CampaignStatsJson } from "@/types/campaign";

export function useRealtimeStats(campaignId: string | null) {
  const [stats, setStats] = useState<CampaignStatsJson | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!campaignId) return;

    const supabase = createClient();

    // Initial fetch
    supabase
      .from("campaigns")
      .select("stats")
      .eq("id", campaignId)
      .single()
      .then(({ data }) => {
        if (data?.stats) {
          setStats(data.stats as unknown as CampaignStatsJson);
        }
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`campaign-stats-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.new.stats) {
            setStats(payload.new.stats as unknown as CampaignStatsJson);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  return { stats, isConnected };
}

export function useRealtimeContactCount(organizationId: string | null) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!organizationId) return;

    const supabase = createClient();

    // Initial fetch
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .then(({ count: c }) => {
        if (c !== null) setCount(c);
      });

    // Subscribe to changes
    const channel = supabase
      .channel(`contacts-count-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          // Re-fetch count on any contact change
          supabase
            .from("contacts")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId)
            .eq("status", "active")
            .then(({ count: c }) => {
              if (c !== null) setCount(c);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  return count;
}
