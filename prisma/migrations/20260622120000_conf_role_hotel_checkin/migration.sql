-- Add HOTEL_CHECKIN conference role for scoped hotel staff access.
ALTER TABLE `ConfMember` MODIFY `role` ENUM(
  'CHAIR',
  'VICE_CHAIR',
  'SECRETARY',
  'FINANCIAL_SECRETARY',
  'TREASURER',
  'COMMITTEE',
  'DELEGATE',
  'HOTEL_CHECKIN'
) NOT NULL DEFAULT 'COMMITTEE';
