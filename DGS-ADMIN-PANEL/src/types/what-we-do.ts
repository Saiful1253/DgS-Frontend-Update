export interface WhatWeDoItem {
  id: number;
  category: string;
  is_available: boolean;
  problem: string;
  problem_desc: string;
  solution: string;
  solution_desc: string;
  sort_order: number;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type WhatWeDoInput = Omit<
  WhatWeDoItem,
  "id" | "is_deleted" | "created_at" | "updated_at"
> & { id?: number };

export interface PaginatedWhatWeDo {
  data: WhatWeDoItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    categoryOffsets: Record<string, number>;
  };
}

export interface WhatWeDoQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}
