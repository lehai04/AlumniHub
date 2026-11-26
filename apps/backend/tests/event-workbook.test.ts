import assert from "node:assert/strict";
import { test } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { eventWorkbook } from "../src/event-workbook.ts";

test("exports ticketing fields as Unicode text and numeric headcounts", () => {
  const book = eventWorkbook({
    slug: "ket-noi",
    title: "Kết nối & Gặp gỡ",
    starts_at: new Date("2030-04-01T10:00:00+07:00"),
    registrations: [
      {
        account_id: "sample",
        full_name: "=Nguyễn Văn A",
        email: "alumni@example.test",
        alumni_code: "ALN 010430 000001",
        registered_at: "2030-03-28T02:30:00.000Z",
        guests: 2,
        total: 3,
      },
    ],
  });
  const files = unzipSync(book);
  const sheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
  assert.match(sheet, /Email đăng ký/);
  assert.match(sheet, /Kết nối &amp; Gặp gỡ/);
  assert.match(
    sheet,
    /<c t="inlineStr"><is><t xml:space="preserve">=Nguyễn Văn A<\/t>/,
  );
  assert.match(sheet, /alumni@example\.test/);
  assert.match(sheet, /<c><v>2<\/v><\/c><c><v>3<\/v><\/c>/);
  assert.doesNotMatch(sheet, /<f>/);
});
