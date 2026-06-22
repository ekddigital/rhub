type DelegateIdentity = {
  id: string;
  userId: string | null;
  email: string | null;
};

export type DelegateViewerContext = {
  isManager: boolean;
  isHotelCheckin: boolean;
  userId: string | null;
  userEmail: string | null;
  delegateId: string | null;
};

function normalizeEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function buildDelegateViewerContext(input: {
  isManager: boolean;
  isHotelCheckin?: boolean;
  delegateId: string | null;
  user: { id: string; email: string } | null;
}): DelegateViewerContext {
  return {
    isManager: input.isManager,
    isHotelCheckin: Boolean(input.isHotelCheckin),
    userId: input.user?.id ?? null,
    userEmail: input.user?.email ?? null,
    delegateId: input.delegateId,
  };
}

export function canViewDelegateSensitiveData(
  delegate: DelegateIdentity,
  viewer: DelegateViewerContext,
): boolean {
  if (viewer.isManager) return true;
  if (viewer.isHotelCheckin) return true;

  if (viewer.delegateId && viewer.delegateId === delegate.id) {
    return true;
  }

  if (viewer.userId && delegate.userId && viewer.userId === delegate.userId) {
    return true;
  }

  const viewerEmail = normalizeEmail(viewer.userEmail);
  const delegateEmail = normalizeEmail(delegate.email);
  if (viewerEmail && delegateEmail && viewerEmail === delegateEmail) {
    return true;
  }

  return false;
}
