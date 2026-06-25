/**
 * Booklet photo precedence (highest → lowest):
 * 1. ConfMember photo when the roster row has a confirmed leader link
 * 2. ConfDelegate booklet photo uploaded during platform signup
 * 3. ConfMember photo matched by name / linked userId (booklet member record)
 * 4. CSV roster leader_photo_url
 */
export function resolveBookletMemberPhotoPath(input: {
  csvPhoto: string | null;
  delegateBookletPhoto: string | null;
  confMemberPhoto: string | null;
  leaderLinkConfirmed: boolean;
}): string | null {
  const { csvPhoto, delegateBookletPhoto, confMemberPhoto, leaderLinkConfirmed } =
    input;

  if (leaderLinkConfirmed && confMemberPhoto) {
    return confMemberPhoto;
  }

  return (
    delegateBookletPhoto ?? confMemberPhoto ?? csvPhoto
  );
}
