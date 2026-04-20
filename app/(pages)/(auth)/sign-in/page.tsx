import SignInForm from "./_components/SignInForm";

function resolveRedirect(
  raw: string | string[] | undefined,
): string {
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  if (Array.isArray(raw) && raw[0]) {
    return raw[0];
  }
  return "/";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const sp = await searchParams;
  const redirect = resolveRedirect(sp.redirect);

  return <SignInForm redirect={redirect} />;
}
