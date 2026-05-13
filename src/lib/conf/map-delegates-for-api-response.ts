import type { ConfDelegate } from "@prisma/client";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import {
  buildDelegateViewerContext,
  canViewDelegateSensitiveData,
  type DelegateViewerContext,
} from "@/lib/conf/delegate-privacy";
import { parseDelegateCommentsWithAddOns } from "@/lib/conf/delegate-fee-addons";

type AccessLike = {
  isManager: boolean;
  delegateId: string | null;
  user: { id: string; email: string } | null;
};

export function buildDelegateListViewerContext(
  access: AccessLike,
): DelegateViewerContext {
  return buildDelegateViewerContext({
    isManager: access.isManager,
    delegateId: access.delegateId,
    user: access.user,
  });
}

export function mapDelegatesForApiResponse(
  delegates: ConfDelegate[],
  viewer: DelegateViewerContext,
  origin: string,
) {
  return delegates.map((delegate) => {
    const delegateWithDocs = delegate as typeof delegate & {
      lastEntryStampPath?: string | null;
      currentVisaPath?: string | null;
    };
    const canViewSensitive = canViewDelegateSensitiveData(
      delegateWithDocs,
      viewer,
    );

    const parsedComments = parseDelegateCommentsWithAddOns(
      delegateWithDocs.additionalComments,
    );
    return {
      ...delegateWithDocs,
      userId: canViewSensitive ? delegate.userId : null,
      passportNo: canViewSensitive ? delegate.passportNo : null,
      email: canViewSensitive ? delegate.email : null,
      phone: canViewSensitive ? delegate.phone : null,
      additionalComments: parsedComments.additionalComments,
      addOnPackageIds: parsedComments.addOnPackageIds,
      passportPhotoPath:
        canViewSensitive && delegateWithDocs.passportPhotoPath
          ? resolveStoredAssetUrl(delegateWithDocs.passportPhotoPath, origin)
          : null,
      lastEntryStampPath:
        canViewSensitive && delegateWithDocs.lastEntryStampPath
          ? resolveStoredAssetUrl(delegateWithDocs.lastEntryStampPath, origin)
          : null,
      currentVisaPath:
        canViewSensitive && delegateWithDocs.currentVisaPath
          ? resolveStoredAssetUrl(delegateWithDocs.currentVisaPath, origin)
          : null,
      bookletPhotoPath:
        canViewSensitive && delegateWithDocs.bookletPhotoPath
          ? resolveStoredAssetUrl(delegateWithDocs.bookletPhotoPath, origin)
          : null,
    };
  });
}
