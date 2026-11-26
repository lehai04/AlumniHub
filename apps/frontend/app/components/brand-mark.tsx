import Image from "next/image";

// Dùng một nguồn logo cho website, tài khoản và khu vực quản trị.
export function BrandMark() {
  return (
    <Image
      className="university-logo"
      src="/assets/van-lang-logo.png"
      alt="Trường Đại học Văn Lang"
      width={173}
      height={43}
      unoptimized
    />
  );
}
