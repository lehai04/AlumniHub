import Link from "next/link";
import { publicSiteOrigin } from "../../lib/seo";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized and all opening angle brackets are escaped.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function Breadcrumbs({
  collection,
  label,
  title,
  slug,
}: {
  collection: "/news" | "/events";
  label: string;
  title: string;
  slug: string;
}) {
  const origin = publicSiteOrigin();
  return (
    <nav aria-label="Đường dẫn trang" className="breadcrumbs">
      {origin && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Trang chủ",
                item: `${origin}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: label,
                item: `${origin}${collection}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: `${origin}${collection}/${slug}`,
              },
            ],
          }}
        />
      )}
      <ol>
        <li>
          <Link href="/">Trang chủ</Link>
        </li>
        <li>
          <Link href={collection}>{label}</Link>
        </li>
        <li aria-current="page">{title}</li>
      </ol>
    </nav>
  );
}
