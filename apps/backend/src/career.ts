import type { Pool, PoolClient } from "pg";
import { profileExtras } from "./career-profile.ts";
import { ApiError } from "./events.ts";

export const careerId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const modes = ["onsite", "hybrid", "remote"];
const jobFields =
  "id,title,company,location,mode,description,published_at,closed_at";
const publicProfile = `jsonb_build_object(
  'fullName', coalesce(p.profile->>'fullName', a.full_name), 'specialty', p.profile->>'specialty',
  'cohort', p.profile->>'cohort', 'intro', p.profile->>'intro',
  'experience', p.profile->>'experience', 'certificates', p.profile->>'certificates'
)`;

function field(value: unknown, max: number, required = true) {
  if (!required && value === undefined) return "";
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    throw new ApiError(400, "invalid_career_fields");
  return value.trim();
}

function jobValues(input: Record<string, unknown>) {
  const mode = field(input.mode, 10);
  if (!modes.includes(mode)) throw new ApiError(400, "invalid_career_fields");
  return [
    field(input.title, 160),
    field(input.company, 160),
    field(input.location, 160),
    mode,
    field(input.description, 6000),
  ];
}

async function transaction<T>(
  pool: Pool,
  action: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

type Pdf = { data: Buffer; name: string };

export function careerStore(pool: Pool) {
  return {
    async profile(account: string) {
      const {
        rows: [row],
      } = await pool.query(
        `SELECT COALESCE(p.profile, jsonb_build_object('fullName', a.full_name, 'email', a.email, 'phone', a.phone)) AS profile,
                COALESCE(p.looking, false) AS looking
         FROM public.alumni_accounts a LEFT JOIN public.career_profiles p ON a.id=p.account_id WHERE a.id=$1`,
        [account],
      );
      return row;
    },
    async saveProfile(account: string, input: Record<string, unknown>) {
      const profile = {
        ...profileExtras(input),
        fullName: field(input.fullName, 120),
        specialty: field(input.specialty, 120, false),
        cohort: field(input.cohort, 30, false),
        birthDate: field(input.birthDate, 10, false),
        email: field(input.email, 254),
        phone: field(input.phone, 15),
        intro: field(input.intro, 1500, false),
        experience: field(input.experience, 2500, false),
        certificates: field(input.certificates, 1500, false),
      };
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) ||
        !/^\d{9,15}$/.test(profile.phone) ||
        (profile.birthDate &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate) ||
            !Number.isFinite(Date.parse(profile.birthDate)) ||
            new Date(profile.birthDate).toISOString().slice(0, 10) !==
              profile.birthDate)) ||
        typeof input.looking !== "boolean"
      )
        throw new ApiError(400, "invalid_career_fields");
      const {
        rows: [saved],
      } = await pool.query(
        `INSERT INTO public.career_profiles (account_id,profile,looking) VALUES ($1,$2,$3)
         ON CONFLICT (account_id) DO UPDATE SET profile=career_profiles.profile || excluded.profile, looking=excluded.looking
         RETURNING profile, looking`,
        [account, profile, input.looking],
      );
      return saved;
    },
    async candidates(account: string, candidateId: string | null = null) {
      const { rows } = await pool.query(
        `SELECT a.id, ${publicProfile} AS profile FROM public.career_profiles p
         JOIN public.alumni_accounts a ON a.id=p.account_id
         JOIN public.alumni_cards c ON c.account_id=a.id
         WHERE p.looking AND a.id <> $1 AND ($2::uuid IS NULL OR a.id=$2) AND EXISTS (
           SELECT 1 FROM public.career_jobs WHERE owner_id=$1 AND published_at IS NOT NULL AND closed_at IS NULL
         ) ORDER BY a.id`,
        [account, candidateId],
      );
      return rows;
    },
    async jobs(search: URLSearchParams) {
      const q = (search.get("q") ?? "").trim().slice(0, 160);
      const location = (search.get("location") ?? "").trim().slice(0, 160);
      const mode = search.get("mode") ?? "";
      if (mode && !modes.includes(mode))
        throw new ApiError(400, "invalid_career_fields");
      const { rows } = await pool.query(
        `SELECT ${jobFields} FROM public.career_jobs WHERE published_at IS NOT NULL
         AND strpos(lower(title || ' ' || company || ' ' || description), lower($1)) > 0
         AND strpos(lower(location), lower($2)) > 0 AND ($3='' OR mode=$3)
         ORDER BY (closed_at IS NOT NULL), published_at DESC, id`,
        [q, location, mode],
      );
      return rows;
    },
    async job(id: string, account: string) {
      const {
        rows: [row],
      } = await pool.query(
        `SELECT ${jobFields}, owner_id=$2 AS is_owner,
         EXISTS(SELECT 1 FROM public.career_applications WHERE job_id=$1 AND account_id=$2) AS has_applied
         FROM public.career_jobs WHERE id=$1 AND published_at IS NOT NULL`,
        [id, account],
      );
      if (!row) throw new ApiError(404, "job_not_found");
      return row;
    },
    async ownJobs(account: string) {
      const { rows } = await pool.query(
        `SELECT ${jobFields} FROM public.career_jobs WHERE owner_id=$1 ORDER BY created_at DESC,id`,
        [account],
      );
      return rows;
    },
    async createJob(account: string, input: Record<string, unknown>) {
      const {
        rows: [row],
      } = await pool.query(
        `INSERT INTO public.career_jobs (owner_id,title,company,location,mode,description)
         SELECT account_id,$2,$3,$4,$5,$6 FROM public.alumni_cards WHERE account_id=$1
         RETURNING ${jobFields}`,
        [account, ...jobValues(input)],
      );
      if (!row) throw new ApiError(403, "forbidden");
      return row;
    },
    async updateJob(
      account: string,
      id: string,
      input: Record<string, unknown>,
    ) {
      const {
        rows: [row],
      } = await pool.query(
        `UPDATE public.career_jobs SET title=$3, company=$4, location=$5, mode=$6, description=$7
         WHERE id=$1 AND owner_id=$2 RETURNING ${jobFields}`,
        [id, account, ...jobValues(input)],
      );
      if (!row) throw new ApiError(404, "job_not_found");
      return row;
    },
    async changeJob(account: string, id: string, action: "publish" | "close") {
      const timestamp = action === "publish" ? "published_at" : "closed_at";
      const {
        rows: [row],
      } = await pool.query(
        `UPDATE public.career_jobs SET ${timestamp}=COALESCE(${timestamp},now())
         WHERE id=$1 AND owner_id=$2 AND ${action === "publish" ? "closed_at IS NULL" : "published_at IS NOT NULL"}
         RETURNING ${jobFields}`,
        [id, account],
      );
      if (!row) throw new ApiError(404, "job_not_found");
      return row;
    },
    async cvs(account: string) {
      const { rows } = await pool.query(
        "SELECT id,name FROM public.career_cvs WHERE account_id=$1 ORDER BY created_at DESC,id",
        [account],
      );
      return rows;
    },
    async addCv(account: string, cv: Pdf) {
      return transaction(pool, async (client) => {
        // Chặn hai lượt tải lên đồng thời vượt giới hạn của cùng tài khoản.
        await client.query(
          "SELECT id FROM public.alumni_accounts WHERE id=$1 FOR UPDATE",
          [account],
        );
        const {
          rows: [row],
        } = await client.query(
          `INSERT INTO public.career_cvs (account_id,name,data)
           SELECT $1,$2,$3 WHERE (SELECT count(*) FROM public.career_cvs WHERE account_id=$1)<5
           RETURNING id,name`,
          [account, cv.name, cv.data],
        );
        if (!row) throw new ApiError(409, "cv_limit");
        return row;
      });
    },
    async updateCv(account: string, id: string, name: unknown, data?: Buffer) {
      const {
        rows: [row],
      } = await pool.query(
        "UPDATE public.career_cvs SET name=$3,data=COALESCE($4,data) WHERE id=$1 AND account_id=$2 RETURNING id,name",
        [id, account, field(name, 120), data ?? null],
      );
      if (!row) throw new ApiError(404, "cv_not_found");
      return row;
    },
    async ownCv(account: string, id: string) {
      const {
        rows: [row],
      } = await pool.query<Pdf>(
        "SELECT name,data FROM public.career_cvs WHERE id=$1 AND account_id=$2",
        [id, account],
      );
      if (!row) throw new ApiError(404, "cv_not_found");
      return row;
    },
    async deleteCv(account: string, id: string) {
      const { rowCount } = await pool.query(
        "DELETE FROM public.career_cvs WHERE id=$1 AND account_id=$2",
        [id, account],
      );
      if (!rowCount) throw new ApiError(404, "cv_not_found");
      return { deleted: true };
    },
    async apply(account: string, id: string, cvId: unknown) {
      if (typeof cvId !== "string" || !careerId.test(cvId))
        throw new ApiError(400, "cv_required");
      return transaction(pool, async (client) => {
        const {
          rows: [job],
        } = await client.query(
          "SELECT owner_id,closed_at FROM public.career_jobs WHERE id=$1 AND published_at IS NOT NULL FOR UPDATE",
          [id],
        );
        if (!job) throw new ApiError(404, "job_not_found");
        if (job.closed_at) throw new ApiError(409, "job_closed");
        if (job.owner_id === account) throw new ApiError(403, "own_job");
        const result = await client.query(
          `INSERT INTO public.career_applications (job_id,account_id,candidate,cv_name,cv_data)
           SELECT $1,a.id,${publicProfile},v.name,v.data FROM public.career_cvs v
           JOIN public.alumni_accounts a ON a.id=v.account_id
           LEFT JOIN public.career_profiles p ON p.account_id=a.id
           WHERE v.id=$2 AND a.id=$3 RETURNING id,submitted_at`,
          [id, cvId, account],
        );
        if (!result.rows[0]) throw new ApiError(404, "cv_not_found");
        return result.rows[0];
      }).catch((error) => {
        if (error?.code === "23505") throw new ApiError(409, "already_applied");
        throw error;
      });
    },
    async history(account: string) {
      const { rows } = await pool.query(
        `SELECT a.id,a.job_id,j.title,j.company,a.cv_name,a.submitted_at
         FROM public.career_applications a JOIN public.career_jobs j ON j.id=a.job_id
         WHERE a.account_id=$1 ORDER BY a.submitted_at DESC,a.id`,
        [account],
      );
      return rows;
    },
    async jobApplications(account: string, id: string) {
      const {
        rows: [job],
      } = await pool.query(
        "SELECT title FROM public.career_jobs WHERE id=$1 AND owner_id=$2",
        [id, account],
      );
      if (!job) throw new ApiError(404, "job_not_found");
      const { rows } = await pool.query(
        `SELECT id,candidate,cv_name,submitted_at FROM public.career_applications
         WHERE job_id=$1 ORDER BY submitted_at DESC,id`,
        [id],
      );
      return { title: job.title, applications: rows };
    },
    async applicationCv(account: string, id: string) {
      const {
        rows: [row],
      } = await pool.query<Pdf>(
        `SELECT a.cv_name AS name,a.cv_data AS data FROM public.career_applications a
         JOIN public.career_jobs j ON j.id=a.job_id WHERE a.id=$1 AND (a.account_id=$2 OR j.owner_id=$2)`,
        [id, account],
      );
      if (!row) throw new ApiError(404, "cv_not_found");
      return row;
    },
  };
}
