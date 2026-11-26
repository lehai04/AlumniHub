import type { Pool } from "pg";
import { ApiError } from "./events.ts";

export const communitySections = ["roles", "posts", "collaborations"] as const;
export type CommunitySection = (typeof communitySections)[number];
export function isCommunitySection(value: string): value is CommunitySection {
  return communitySections.some((section) => section === value);
}

function field(input: unknown, max: number, optional = false) {
  if (optional && input === undefined) return "";
  if (
    typeof input !== "string" ||
    input.trim().length > max ||
    (!optional && !input.trim())
  )
    throw new ApiError(400, "invalid_community_fields");
  return input.trim();
}

function evidence(input: unknown) {
  const value = field(input, 1000);
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password)
      return url.href;
  } catch {}
  throw new ApiError(400, "invalid_evidence");
}

const roleRows = `SELECT r.id,r.role,r.reason,r.evidence_url,r.status,r.created_at,
  r.reviewed_by,r.reviewed_at,r.decision_note,r.ended_at,r.ended_by,r.end_note,
  a.full_name AS target_name, c.code AS target_code, sender.full_name AS requester_name
  FROM public.alumni_role_requests r JOIN public.alumni_accounts a ON a.id=r.target_id
  JOIN public.alumni_cards c ON c.account_id=r.target_id
  JOIN public.alumni_accounts sender ON sender.id=r.requester_id`;
const postRows = `SELECT p.id,p.body,p.topic,p.status,p.created_at,a.full_name AS author_name
  FROM public.alumni_community_posts p JOIN public.alumni_accounts a ON a.id=p.author_id`;
const collaborationRows = `SELECT s.id,s.need,s.contact_email,s.requested_unit,s.assigned_unit,s.status,
  s.created_at,s.updated_at,s.handling_note,a.full_name AS sender_name
  FROM public.alumni_collaborations s JOIN public.alumni_accounts a ON a.id=s.account_id`;

export function communityStore(pool: Pool) {
  return {
    async board() {
      const { rows } = await pool.query(
        `${postRows} WHERE p.status='visible' ORDER BY p.created_at DESC,p.id`,
      );
      return rows;
    },
    async mine(section: CommunitySection, account: string) {
      const query =
        section === "roles"
          ? `${roleRows} WHERE r.requester_id=$1 ORDER BY r.created_at DESC,r.id`
          : section === "posts"
            ? `${postRows} WHERE p.author_id=$1 ORDER BY p.created_at DESC,p.id`
            : `${collaborationRows} WHERE s.account_id=$1 ORDER BY s.created_at DESC,s.id`;
      return (await pool.query(query, [account])).rows;
    },
    async list(section: CommunitySection) {
      const query =
        section === "roles"
          ? `${roleRows} ORDER BY (r.status<>'pending'),r.created_at DESC,r.id`
          : section === "posts"
            ? `${postRows} ORDER BY (p.status<>'pending'),p.created_at DESC,p.id`
            : `${collaborationRows} ORDER BY (s.status='closed'),s.created_at DESC,s.id`;
      return (await pool.query(query)).rows;
    },
    async submit(
      section: CommunitySection,
      account: string,
      input: Record<string, unknown>,
    ) {
      if (section === "roles") {
        const role = input.role;
        if (role !== "engagement" && role !== "ambassador")
          throw new ApiError(400, "invalid_community_fields");
        const reason = field(input.reason, 2000);
        const link = evidence(input.evidence);
        let target = account;
        if (role === "ambassador") {
          const code = field(input.targetCode, 32)
            .replace(/\s+/g, " ")
            .toUpperCase();
          const {
            rows: [card],
          } = await pool.query<{ account_id: string }>(
            "SELECT account_id FROM public.alumni_cards WHERE code=$1",
            [code],
          );
          if (!card || card.account_id === account)
            throw new ApiError(400, "invalid_nominee");
          target = card.account_id;
        }
        const {
          rows: [result],
        } = await pool.query(
          `INSERT INTO public.alumni_role_requests (requester_id,target_id,role,reason,evidence_url)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id,status`,
          [account, target, role, reason, link],
        );
        if (!result) throw new ApiError(409, "active_role_request");
        return result;
      }
      if (section === "posts") {
        if (input.topic !== "intro" && input.topic !== "career")
          throw new ApiError(400, "invalid_community_fields");
        const {
          rows: [result],
        } = await pool.query(
          "INSERT INTO public.alumni_community_posts(author_id,topic,body) VALUES($1,$2,$3) RETURNING id,status",
          [account, input.topic, field(input.body, 2000)],
        );
        return result;
      }
      const email = field(input.email, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new ApiError(400, "invalid_community_fields");
      const {
        rows: [result],
      } = await pool.query(
        `INSERT INTO public.alumni_collaborations(account_id,need,contact_email,requested_unit)
         VALUES($1,$2,$3,$4) RETURNING id,status`,
        [account, field(input.need, 3000), email, field(input.unit, 160, true)],
      );
      return result;
    },
    async process(
      section: CommunitySection,
      id: string,
      admin: string,
      input: Record<string, unknown>,
    ) {
      const action = input.action;
      const note = field(input.note, 1500, true);
      if (section === "roles") {
        if (action !== "approve" && action !== "reject" && action !== "end")
          throw new ApiError(400, "invalid_community_fields");
        const ending = action === "end";
        const query = ending
          ? `UPDATE public.alumni_role_requests SET ended_by=$2,ended_at=now(),end_note=$3
             WHERE id=$1 AND status='approved' AND ended_at IS NULL RETURNING id,status,ended_at`
          : `UPDATE public.alumni_role_requests SET reviewed_by=$2,reviewed_at=now(),decision_note=$3,status=$4
             WHERE id=$1 AND status='pending' RETURNING id,status`;
        const {
          rows: [result],
        } = await pool.query(
          query,
          ending
            ? [id, admin, note]
            : [id, admin, note, action === "approve" ? "approved" : "rejected"],
        );
        if (!result) throw new ApiError(409, "community_transition");
        return result;
      }
      if (section === "posts") {
        if (action !== "show" && action !== "hide")
          throw new ApiError(400, "invalid_community_fields");
        const {
          rows: [result],
        } = await pool.query(
          `UPDATE public.alumni_community_posts SET status=$2,moderated_by=$3,moderated_at=now()
           WHERE id=$1 RETURNING id,status`,
          [id, action === "show" ? "visible" : "hidden", admin],
        );
        if (!result) throw new ApiError(404, "not_found");
        return result;
      }
      if (action !== "forward" && action !== "close")
        throw new ApiError(400, "invalid_community_fields");
      const forwarding = action === "forward";
      const {
        rows: [result],
      } = await pool.query(
        `UPDATE public.alumni_collaborations SET assigned_unit=COALESCE($2,assigned_unit),
         handled_by=$3,updated_at=now(),handling_note=$4,status=$5
         WHERE id=$1 AND status=$6 RETURNING id,status,assigned_unit`,
        [
          id,
          forwarding ? field(input.unit, 160) : null,
          admin,
          note,
          forwarding ? "forwarded" : "closed",
          forwarding ? "pending" : "forwarded",
        ],
      );
      if (!result) throw new ApiError(409, "community_transition");
      return result;
    },
  };
}
