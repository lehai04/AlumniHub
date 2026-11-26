import Link from "next/link";
import { eventDate, readBackend, readSession } from "../../../lib/backend";
import { roleNames } from "../../../lib/community";
import { SessionForm } from "../../components/session-form";
import { AuthEntry } from "./auth-entry";
import "./account.css";

type Profile = {
  full_name: string;
  faculty: string;
  cohort?: string;
  created_at: string;
  code: string | null;
  issued_at: string | null;
  roles: (keyof typeof roleNames)[];
};

export default async function AccountPage() {
  const { account, localLogin, registrationEnabled, passwordResetEnabled } =
    await readSession();
  if (!account)
    return (
      <AuthEntry
        registrationEnabled={registrationEnabled}
        localLogin={localLogin}
        passwordResetEnabled={passwordResetEnabled}
      />
    );
  let profile: Profile | null = null;
  if (!account.id.startsWith("local:")) {
    const response = await readBackend("/api/applications/mine", true);
    if (response.ok) profile = await response.json();
  }
  const cardType = profile?.roles.includes("ambassador")
    ? "ambassador"
    : profile?.roles.includes("engagement")
      ? "engagement"
      : "member";
  return (
    <section className="page-section account-hub">
      <h1>Tài khoản Alumni</h1>
      {profile && (
        <article
          className={`info-card account-profile-card ${profile.code ? `alumni-card-${cardType}` : "account-profile-pending"}`}
        >
          <div className="account-profile-heading">
            <h2>Thẻ của tôi</h2>
            <span>{profile.code ? "Đã duyệt" : "Chờ duyệt"}</span>
          </div>
          <p>
            {profile.full_name} · {profile.faculty}
            {profile.cohort ? ` · ${profile.cohort}` : ""}
          </p>
          {profile.code && profile.issued_at ? (
            <>
              <p>{`Đã duyệt · Thẻ ${cardType === "member" ? "Thành viên" : roleNames[cardType]}`}</p>
              {profile.roles.length > 0 && (
                <p>
                  Vai trò còn hiệu lực:{" "}
                  {profile.roles.map((role) => roleNames[role]).join(", ")}
                </p>
              )}
              <p>
                Mã Alumni: <strong>{profile.code}</strong>
              </p>
              <p>Ngày cấp {eventDate(profile.issued_at)}</p>
            </>
          ) : (
            <>
              <p>Hồ sơ được gửi ngày {eventDate(profile.created_at)}.</p>
              <p>Thời gian trả kết quả sẽ được cập nhật khi có quy định.</p>
            </>
          )}
        </article>
      )}
      <SessionForm signedIn />
      {account.role === "alumni" && <Link href="/events">Xem sự kiện</Link>}
      {profile?.code && (
        <p>
          <Link href="/community?tab=roles">Đề nghị và đề cử vai trò</Link>
          {" · "}
          <Link href="/career?tab=profile">Hồ sơ nghề nghiệp</Link>
          {" · "}
          <Link href="/career">Việc làm</Link>
          {" · "}
          <Link href="/career?tab=history">Lịch sử ứng tuyển</Link>
        </p>
      )}
    </section>
  );
}
