export const workModes = {
  onsite: "Tại văn phòng",
  hybrid: "Kết hợp",
  remote: "Từ xa",
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: keyof typeof workModes;
  description: string;
  published_at: string | null;
  closed_at: string | null;
};
export type Profile = { profile: Record<string, string>; looking: boolean };
export type Cv = { id: string; name: string };
export type Candidate = {
  fullName: string;
  specialty?: string | null;
  cohort?: string | null;
  intro?: string | null;
  experience?: string | null;
  certificates?: string | null;
};
export type Application = {
  id: string;
  cv_name: string;
  submitted_at: string;
  candidate: Candidate;
};
export type History = Omit<Application, "candidate"> & {
  job_id: string;
  title: string;
  company: string;
};
