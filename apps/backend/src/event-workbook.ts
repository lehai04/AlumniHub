import { strToU8, zipSync } from "fflate";

type Registration = {
  account_id: string;
  full_name: string | null;
  alumni_code: string | null;
  email: string | null;
  registered_at: string;
  guests: number;
  total: number;
};

type Report = {
  slug: string;
  title: string;
  starts_at: Date;
  registrations: Registration[];
};

const spreadsheet = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const relationships =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const packageRelationships =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Asia/Ho_Chi_Minh",
});

function xml(value: string) {
  return Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return (
        code === 9 ||
        code === 10 ||
        code === 13 ||
        (code >= 32 && code <= 0xd7ff) ||
        (code >= 0xe000 && code <= 0xfffd) ||
        code >= 0x10000
      );
    })
    .join("")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function row(values: (string | number)[]) {
  // Dữ liệu người dùng được ghi dưới dạng văn bản, kể cả chuỗi bắt đầu bằng dấu bằng.
  return `<row>${values
    .map((value) =>
      typeof value === "number"
        ? `<c><v>${value}</v></c>`
        : `<c t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`,
    )
    .join("")}</row>`;
}

export function eventWorkbook(report: Report) {
  const heading = row([
    "Mã sự kiện",
    "Tên sự kiện",
    "Giờ bắt đầu (VN)",
    "Họ tên",
    "Mã Alumni",
    "Email đăng ký",
    "Giờ đăng ký (VN)",
    "Số người đi cùng",
    "Tổng số người",
  ]);
  const start = dateTime.format(report.starts_at);
  const rows = report.registrations.map((entry) =>
    row([
      report.slug,
      report.title,
      start,
      entry.full_name ?? entry.account_id,
      entry.alumni_code ?? "",
      entry.email ?? "",
      dateTime.format(new Date(entry.registered_at)),
      entry.guests,
      entry.total,
    ]),
  );
  const columns = [26, 38, 22, 28, 25, 38, 22, 21, 18]
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join("");
  return zipSync({
    "[Content_Types].xml": strToU8(
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    ),
    "_rels/.rels": strToU8(
      `<Relationships xmlns="${packageRelationships}"><Relationship Id="rId1" Type="${relationships}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<workbook xmlns="${spreadsheet}" xmlns:r="${relationships}"><sheets><sheet name="Danh sách đăng ký" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<Relationships xmlns="${packageRelationships}"><Relationship Id="rId1" Type="${relationships}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    ),
    "xl/worksheets/sheet1.xml": strToU8(
      `<worksheet xmlns="${spreadsheet}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${columns}</cols><sheetData>${heading}${rows.join("")}</sheetData></worksheet>`,
    ),
  });
}
