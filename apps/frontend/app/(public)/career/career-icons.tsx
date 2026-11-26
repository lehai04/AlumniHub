import Image from "next/image";

const paths = {
  home: "m2 11 10-9 10 9 M5 9v13h5v-7h4v7h5V9",
  file: "M5 2h9l5 5v15H5Z M14 2v6h5 M8 12h8 M8 16h8",
  bell: "M5 9a7 7 0 0 1 14 0v7l2 3H3l2-3Z M9 22h6",
  layers: "m2 7 10-5 10 5-10 5Z M2 12l10 5 10-5 M2 17l10 5 10-5",
  folder: "M2 5h7l3 3h10v13H2Z",
  star: "m12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z",
  calendar: "M3 5h18v17H3Z M7 2v6 M17 2v6 M3 10h18 M7 14h2 M15 14h2 M7 18h2",
  mail: "M2 4h20v16H2Z m0 0 10 9L22 4",
  phone: "m4 2 5 4-3 4c2 4 4 6 8 8l4-3 4 5c-8 8-26-10-18-18Z",
  link: "m10 14 4-4 M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0",
  eye: "M1 12c6-10 16-10 22 0-6 10-16 10-22 0Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  download: "M12 2v14 m-5-5 5 5 5-5 M3 16v6h18v-6",
  upload: "M12 16V2 m-5 5 5-5 5 5 M3 16v6h18v-6",
  camera: "M2 7h5l2-4h6l2 4h5v14H2Z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  check: "m5 12 4 4L20 5",
  info: "M12 11v7 M12 6v1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  search: "m21 21-5-5 M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  briefcase: "M8 6V3h8v3 M3 6h18v15H3Z M3 11c6 5 12 5 18 0 M10 13h4",
  bookmark: "M6 3h12v19l-6-5-6 5Z",
  send: "m22 2-7 20-4-9-9-4Z m-11 11 11-11",
  user: "M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M3 22v-3a9 9 0 0 1 18 0v3Z",
  arrow: "M3 12h18 m-6-6 6 6-6 6",
  chart: "M2 22h20 M5 18V11h3v7 M11 18V6h3v12 M17 18V2h3v16",
  megaphone: "m3 8 18-5v15L3 14Z M6 15l2 7h4l-2-6 M3 8H1v6h2",
  monitor: "M3 3h18v14H3Z M1 21h22 M9 17v4 M15 17v4",
  coins:
    "M21 5c0 2-3 3-7 3s-7-1-7-3 3-3 7-3 7 1 7 3Z M7 5v5 M21 5v10c0 2-3 3-7 3 M21 10c0 2-3 3-7 3 M1 13c0 2 3 3 6 3s6-1 6-3-3-3-6-3-6 1-6 3Z M1 13v7c0 2 3 3 6 3s6-1 6-3v-7",
  cap: "m1 8 11-6 11 6-11 6Z M5 11v7c5 4 9 4 14 0v-7 M23 8v12",
  pen: "m4 16 12-14 6 5L10 21l-8 2Z m10-12 6 5 M4 16l6 5",
  gear: "m9 2-1 4-4 1-2 4 3 3v4l4 2 3-2 4 2 4-2v-4l3-3-2-4-4-1-1-4Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  grid: "M2 2h7v7H2Z M15 2h7v7h-7Z M2 15h7v7H2Z M15 15h7v7h-7Z",
  money: "M3 6h18v12H3Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M1 9v6 M23 9v6",
  close: "m5 5 14 14 M19 5 5 19",
} as const;

export function CareerIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function CompanyMark({
  brand,
  company,
}: {
  brand?: string;
  company: string;
}) {
  return (
    <span
      className={`company-mark company-mark--${brand ?? "default"}`}
      aria-hidden="true"
    >
      {brand === "vlu" ? (
        <Image
          src="/assets/van-lang-logo.png"
          alt=""
          width={173}
          height={43}
          unoptimized
        />
      ) : brand === "fpt" ? (
        <span className="fpt-letters">
          <i>F</i>
          <i>P</i>
          <i>T</i>
        </span>
      ) : brand ? (
        brand === "grab" ? (
          "Grab"
        ) : (
          brand.toUpperCase()
        )
      ) : (
        company.trim().slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
