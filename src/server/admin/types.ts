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
  activity: {
    signupsByDay: { date: string; count: number }[];
    designsByDay: { date: string; count: number }[];
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
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
