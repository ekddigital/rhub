import {
  resolveDelegateBookletPhotoForClient,
  resolveMemberPhotoForClient,
} from "@/lib/conf/delegate-document-urls";

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
  const csvPhoto = input.csvPhoto?.trim() || null;
  const delegateBookletPhoto = input.delegateBookletPhoto?.trim() || null;
  const confMemberPhoto = input.confMemberPhoto?.trim() || null;
  const { leaderLinkConfirmed } = input;

  if (leaderLinkConfirmed && confMemberPhoto) {
    return confMemberPhoto;
  }

  return delegateBookletPhoto ?? confMemberPhoto ?? csvPhoto;
}

/** Committee UI photo precedence: manual member upload → linked delegate booklet photo. */
export function resolveCommitteeMemberPhotoForClient(input: {
  confId: string;
  memberId: string;
  memberPhotoPath: string | null | undefined;
  linkedDelegateId?: string | null;
  linkedDelegateBookletPhotoPath?: string | null | undefined;
}): string | null {
  if (input.memberPhotoPath?.trim()) {
    return resolveMemberPhotoForClient(
      input.confId,
      input.memberId,
      input.memberPhotoPath,
    );
  }

  if (
    input.linkedDelegateId &&
    input.linkedDelegateBookletPhotoPath?.trim()
  ) {
    return resolveDelegateBookletPhotoForClient(
      input.confId,
      input.linkedDelegateId,
      input.linkedDelegateBookletPhotoPath,
    );
  }

  return null;
}
