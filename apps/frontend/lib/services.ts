export type ServiceContent = {
  id: string;
  category: "benefits" | "library";
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  status: "draft" | "submitted" | "published" | "withdrawn";
  revision: number;
};

export const serviceLabels = { benefits: "Ưu đãi Alumni", library: "Thư viện" };
