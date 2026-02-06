"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DateRange } from "@/types/analytics";
import { subDays, subMonths } from "date-fns";

function getDateRange(range: DateRange): { from: Date; to: Date } {
  const to = new Date();
  switch (range) {
    case "7d":
      return { from: subDays(to, 7), to };
    case "30d":
      return { from: subDays(to, 30), to };
    case "90d":
      return { from: subDays(to, 90), to };
    case "12m":
      return { from: subMonths(to, 12), to };
    default:
      return { from: subDays(to, 30), to };
  }
}

export function useOverviewStats(organizationId: string, range: DateRange = "30d") {
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics", "overview", organizationId, range],
    queryFn: async () => {
      const supabase = createClient();

      // Fetch contact count
      const { count: totalContacts } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId);

      const { count: activeContacts } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "active");

      // Fetch campaign stats for the period
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("stats, status")
        .eq("organization_id", organizationId)
        .eq("status", "sent")
        .gte("send_completed_at", from.toISOString())
        .lte("send_completed_at", to.toISOString());

      // Aggregate stats
      let totalSent = 0;
      let totalOpened = 0;
      let totalClicked = 0;
      let totalBounced = 0;
      let totalUnsubscribed = 0;

      (campaigns || []).forEach((c) => {
        const stats = c.stats as Record<string, number> | null;
        if (stats) {
          totalSent += stats.total_sent || 0;
          totalOpened += stats.unique_opens || 0;
          totalClicked += stats.unique_clicks || 0;
          totalBounced += stats.total_bounced || 0;
          totalUnsubscribed += stats.total_unsubscribed || 0;
        }
      });

      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
      const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
      const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0;

      // Fetch org limits
      const { data: org } = await supabase
        .from("organizations")
        .select("monthly_emails_sent, monthly_email_limit")
        .eq("id", organizationId)
        .single();

      return {
        totalContacts: totalContacts || 0,
        activeContacts: activeContacts || 0,
        totalEmailsSent: totalSent,
        monthlyEmailsSent: org?.monthly_emails_sent || 0,
        monthlyEmailLimit: org?.monthly_email_limit || 1000,
        avgOpenRate: Math.round(openRate * 10) / 10,
        avgClickRate: Math.round(clickRate * 10) / 10,
        avgBounceRate: Math.round(bounceRate * 10) / 10,
        avgUnsubscribeRate: Math.round(unsubscribeRate * 10) / 10,
        deliverabilityScore: Math.max(0, Math.round(100 - bounceRate * 10 - unsubscribeRate * 5)),
        contactGrowth: 0,
        contactGrowthPercent: 0,
      };
    },
    enabled: !!organizationId,
  });
}

export function useTimeSeriesData(organizationId: string, range: DateRange = "30d") {
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics", "timeseries", organizationId, range],
    queryFn: async () => {
      const supabase = createClient();

      const { data: events } = await supabase
        .from("email_events")
        .select("event_type, timestamp")
        .eq("organization_id", organizationId)
        .gte("timestamp", from.toISOString())
        .lte("timestamp", to.toISOString())
        .order("timestamp", { ascending: true });

      // Group by date
      const dateMap = new Map<
        string,
        { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number }
      >();

      (events || []).forEach((event) => {
        const date = event.timestamp?.split("T")[0] || "";
        if (!dateMap.has(date)) {
          dateMap.set(date, { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });
        }
        const entry = dateMap.get(date)!;
        switch (event.event_type) {
          case "sent":
            entry.sent++;
            break;
          case "opened":
            entry.opened++;
            break;
          case "clicked":
            entry.clicked++;
            break;
          case "bounced":
            entry.bounced++;
            break;
          case "unsubscribed":
            entry.unsubscribed++;
            break;
        }
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!organizationId,
  });
}
