import { eventDate, readBackend } from "../../../lib/backend";
import { sectionMetadata } from "../../../lib/seo";
import { type ServiceContent, serviceLabels } from "../../../lib/services";
import { PageIntro } from "../page-intro";

export function generateMetadata() {
  return sectionMetadata("services");
}

export default async function ServicesPage() {
  const response = await readBackend("/api/services");
  if (!response.ok) throw new Error("Cannot load service content");
  const entries: ServiceContent[] = await response.json();
  return (
    <section className="page-section">
      <PageIntro page="services" />
      <div className="services-sections">
        {(["benefits", "library"] as const).map((category) => {
          const items = entries.filter((entry) => entry.category === category);
          return (
            <section id={category} key={category}>
              <h2>{serviceLabels[category]}</h2>
              {!items.length && <p>Chưa có nội dung đang hiệu lực.</p>}
              {items.map((entry) => (
                <article className="info-card" key={entry.id}>
                  <h3>{entry.title}</h3>
                  <p>
                    Hiệu lực từ {eventDate(entry.starts_at)}
                    {entry.ends_at && ` đến ${eventDate(entry.ends_at)}`}
                  </p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{entry.body}</p>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </section>
  );
}
