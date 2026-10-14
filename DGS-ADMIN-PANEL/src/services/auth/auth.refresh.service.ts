import { refreshAccessTokenAction } from "@/actions/auth.actions";

/**
 * Token-rotation service.
 *
 * No transport lives here. `refreshAccessTokenAction` owns the `/auth/refresh`
 * call and the cookie rewrite; this module only maps the action's `ActionResult`
 * onto the flat shape `lib/server-fetch.ts` reads — that file cannot be changed,
 * so the adapter has to live on this side of the boundary.
 *
 * Every read is a failure here by design: a caller that cannot rotate a token
 * must fall back to the cookie it already has, never to a half-written session.
 */

export interface TokenRefreshOutcome {
  tokenRefreshed: boolean;
  success: boolean;
  message: string;
  accessToken?: string | null;
}

export const getNewAccessToken = async (): Promise<TokenRefreshOutcome> => {
  const res = await refreshAccessTokenAction();
  const data = res.data as { tokenRefreshed?: boolean; accessToken?: string | null } | undefined;

  if (!res.success || !data?.tokenRefreshed) {
    return {
      tokenRefreshed: false,
      success: res.success,
      message: res.message || "Something went wrong",
    };
  }

  return {
    tokenRefreshed: true,
    success: true,
    message: res.message || "Token refreshed successfully",
    accessToken: data.accessToken,
  };
};
