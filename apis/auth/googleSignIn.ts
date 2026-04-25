import requestApi from "@/utils/requestApi";

const url = "/auth/oauth/google";

type GoogleAuthUrlApiResponse = {
  data?: {
    authorizationUrl?: string;
    authorization_url?: string;
  };
};

export const getGoogleAuthorizationUrl = async (): Promise<{
  data: {
    authorizationUrl: string;
  };
}> => {
  const response = await requestApi.get<GoogleAuthUrlApiResponse>(url);
  const authorizationUrl =
    response?.data?.authorizationUrl ?? response?.data?.authorization_url;

  if (!authorizationUrl) {
    throw new Error("Google authorization URL is missing from response");
  }

  return {
    data: {
      authorizationUrl,
    },
  };
};
