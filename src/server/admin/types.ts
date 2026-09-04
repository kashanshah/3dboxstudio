export type AdminS3Window = {
  objects: number;
  bytes: number;
};

export type AdminS3Usage = {
  available: boolean;
  error?: string;
  bucket: string;
  region: string;
  prefix: string;
  scannedAt: string;
  objectCount: number;
  totalBytes: number;
  averageBytes: number;
  faceImages: number;
  ogImages: number;
  otherObjects: number;
  last7Days: AdminS3Window;
  last30Days: AdminS3Window;
  objectsByDay: { date: string; count: number; bytes: number }[];
  storageClasses: { label: string; objects: number; bytes: number }[];
  estimatedMonthlyStorageUsd: number;
  estimatedMonthlyPutUsd: number;
  truncated: boolean;
};

export type AdminDbImageCounts = {
  faceImages: number;
  ogImages: number;
  last7Days: number;
  last30Days: number;
  imagesByDay: { date: string; count: number }[];
};

export type AdminStats = {
  users: {
    total: number;
    verified: number;
    unverified: number;
    last7Days: number;
    last30Days: number;
  };
  designs: {
    total: number;
    owned: number;
    anonymous: number;
    expired: number;
    last7Days: number;
    last30Days: number;
    totalViews: number;
  };
  images: AdminDbImageCounts;
  s3: AdminS3Usage;
  activity: {
    signupsByDay: { date: string; count: number }[];
    designsByDay: { date: string; count: number }[];
    signupsBySource: { label: string; count: number }[];
    signupsByMethod: { label: string; count: number }[];
    signupsByLandingType: { label: string; count: number }[];
    signupsByConversionType: { label: string; count: number }[];
  };
};

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
  designCount: number;
  totalViews: number;
  signupMethod: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  signupLandingPage: string | null;
  signupLandingType: string | null;
  signupConversionPage: string | null;
  signupReferrer: string | null;
};

export type AdminDesignRow = {
  id: string;
  name: string | null;
  previewToken: string | null;
  userId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  viewCount: number;
  isExpired: boolean;
  isAnonymous: boolean;
  hasOgImage: boolean;
  faceImageCount: number;
  thumbnailUrl: string | null;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminAnalyticsGranularity = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export type AdminAnalyticsSeriesPoint = {
  periodStart: string;
  label: string;
  signupsEmail: number;
  signupsGoogle: number;
  signupsVerified: number;
  signupsUnverified: number;
  verifications: number;
  usersWithFirstDesign: number;
  designsCreated: number;
  imagesUploaded: number;
  bytesUploaded: number;
};

export type AdminAnalytics = {
  granularity: AdminAnalyticsGranularity;
  buckets: number;
  rangeStart: string;
  rangeEnd: string;
  summary: {
    signups: number;
    signupsEmail: number;
    signupsGoogle: number;
    signupsVerified: number;
    signupsUnverified: number;
    verifications: number;
    usersWithFirstDesign: number;
    designsCreated: number;
    imagesUploaded: number;
    bytesUploaded: number;
    usersWithDesignTotal: number;
    usersWithoutDesignTotal: number;
  };
  s3Available: boolean;
  s3Error?: string;
  series: AdminAnalyticsSeriesPoint[];
};
