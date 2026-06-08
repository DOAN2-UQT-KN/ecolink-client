import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams as useRouterSearchParams,
  type LinkProps,
} from "react-router-dom";

export type AppRouter = {
  push: (href: string, _options?: { scroll?: boolean }) => void;
  replace: (href: string, _options?: { scroll?: boolean }) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (_href: string) => void;
};

export function useRouter(): AppRouter {
  const navigate = useNavigate();

  return {
    push: (href) => navigate(href),
    replace: (href) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => navigate(0),
    prefetch: () => undefined,
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

type NextLinkProps = Omit<LinkProps, "to"> & {
  href: string;
};

export function Link({ href, children, ...props }: NextLinkProps) {
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}

export default Link;

export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export { useParams };
