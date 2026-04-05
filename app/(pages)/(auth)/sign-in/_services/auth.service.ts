import { ISignInResponse } from "@/apis/auth/models/signIn";
import useAuthStore from "@/stores/useAuthStore";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface ISignInFormValues {
  email: string;
  password: string;
}

export const handleSignInSuccess = (
  res: ISignInResponse,
  router: AppRouterInstance,
  redirect: string,
) => {
  if (res.data) {
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    } = res.data;

    // Set access token and user in store
    useAuthStore.getState().setLoginSuccess(accessToken, user, refreshToken);

    // Set refresh token in cookie
    document.cookie = `refresh_token=${refreshToken}; path=/; Max-Age=2592000; Secure; SameSite=Lax`;

    router.push(redirect);
  }
};
