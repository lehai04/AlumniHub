-- Lưu khóa theo học từ bước đăng ký mới; hồ sơ cũ tiếp tục hoạt động.
ALTER TABLE public.alumni_accounts
  ADD COLUMN cohort text NOT NULL DEFAULT '' CHECK (char_length(cohort) <= 30);
