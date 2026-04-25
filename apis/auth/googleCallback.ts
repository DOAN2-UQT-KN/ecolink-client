import requestApi from "@/utils/requestApi";
import { ISignInResponse } from "./models/signIn";

const GOOGLE_CALLBACK_URL = "/auth/oauth/google/callback";

export const googleCallback = async (code: string): Promise<ISignInResponse> => {
  return await requestApi.get<ISignInResponse>(GOOGLE_CALLBACK_URL, { code });
};
