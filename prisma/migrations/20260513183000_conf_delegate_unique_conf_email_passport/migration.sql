-- Enforce at most one non-null email and one non-null passport per conference.
-- Before deploying: remove duplicate rows, e.g.
--   SELECT confId, email, COUNT(*) c FROM ConfDelegate WHERE email IS NOT NULL AND email <> '' GROUP BY confId, email HAVING c > 1;
--   SELECT confId, passportNo, COUNT(*) c FROM ConfDelegate WHERE passportNo IS NOT NULL AND passportNo <> '' GROUP BY confId, passportNo HAVING c > 1;

CREATE UNIQUE INDEX `ConfDelegate_confId_email_key` ON `ConfDelegate`(`confId`, `email`);
CREATE UNIQUE INDEX `ConfDelegate_confId_passportNo_key` ON `ConfDelegate`(`confId`, `passportNo`);
