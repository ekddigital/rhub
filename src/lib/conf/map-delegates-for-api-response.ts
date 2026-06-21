import type { ConfDelegate } from "@prisma/client";
import { mapDelegateDocumentsForClient } from "@/lib/conf/delegate-document-urls";
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
  _origin: string,
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

    const storedDocs = canViewSensitive
      ? {
          passportPhotoPath: delegateWithDocs.passportPhotoPath,
          lastEntryStampPath: delegateWithDocs.lastEntryStampPath,
          currentVisaPath: delegateWithDocs.currentVisaPath,
          bookletPhotoPath: delegateWithDocs.bookletPhotoPath,
        }
      : {
          passportPhotoPath: null,
          lastEntryStampPath: null,
          currentVisaPath: null,
          bookletPhotoPath: null,
        };

    return {
      ...delegateWithDocs,
      userId: canViewSensitive ? delegate.userId : null,
      passportNo: canViewSensitive ? delegate.passportNo : null,
      email: canViewSensitive ? delegate.email : null,
      phone: canViewSensitive ? delegate.phone : null,
      additionalComments: parsedComments.additionalComments,
      addOnPackageIds: parsedComments.addOnPackageIds,
      ...mapDelegateDocumentsForClient(
        delegate.confId,
        delegate.id,
        storedDocs,
      ),
    };
  });
}
