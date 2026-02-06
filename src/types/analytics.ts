export interface OverviewStats {
  totalContacts: number;
  activeContacts: number;
  totalEmailsSent: number;
  monthlyEmailsSent: number;
  monthlyEmailLimit: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgBounceRate: number;
  avgUnsubscribeRate: number;
  deliverabilityScore: number;
  contactGrowth: number;
  contactGrowthPercent: number;
}

export interface CampaignStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  uniqueOpens: number;
  totalClicked: number;
  uniqueClicks: number;
  totalBounced: number;
  hardBounces: number;
  softBounces: number;
  totalUnsubscribed: number;
  totalComplained: number;
  totalForwarded: number;
  revenueGenerated: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
  unknown: number;
}

export interface EmailClientBreakdown {
  name: string;
  count: number;
  percentage: number;
}

export interface GeoData {
  country: string;
  city: string;
  count: number;
}

export interface EngagementSegment {
  label: string;
  range: string;
  count: number;
  percentage: number;
  color: string;
}

export interface LinkStats {
  id: string;
  url: string;
  totalClicks: number;
  uniqueClicks: number;
  clickRate: number;
}

export interface FunnelStep {
  label: string;
  value: number;
  rate: number;
  color: string;
}

export type DateRange = "7d" | "30d" | "90d" | "12m" | "custom";

export interface DateRangeValue {
  from: Date;
  to: Date;
  preset?: DateRange;
}
