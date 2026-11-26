import Image from "next/image";
import { readPageIntro } from "../../lib/public-content";
import type { PublicPage } from "../../lib/public-pages";

export async function PageIntro({
  page,
  presentation,
}: {
  page: PublicPage;
  presentation?: "cover" | "poster";
}) {
  const { title, description, image, alt, linkUrl, linkLabel } =
    await readPageIntro(page);
  return (
    <header
      className="public-banner"
      data-media={Boolean(image)}
      data-presentation={presentation}
    >
      <div className="public-banner-copy">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {linkUrl && linkLabel && (
          <a className="button button-outline" href={linkUrl}>
            {linkLabel}
          </a>
        )}
      </div>
      {image && (
        <div className="public-banner-media">
          <Image
            src={image}
            alt={alt}
            width={presentation ? 1440 : 960}
            height={presentation === "poster" ? 446 : presentation ? 522 : 540}
            preload={Boolean(presentation)}
            unoptimized
          />
        </div>
      )}
    </header>
  );
}
