import { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams as useReactRouterSearchParams,
} from "react-router-dom";

export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [searchParams] = useReactRouterSearchParams();
  return searchParams;
}

export function useParamsCompat() {
  return useParams();
}

export function notFound(): never {
  throw new Error("Not found");
}

export function redirect(href: string): never {
  window.location.assign(href);
  throw new Error(`Redirecting to ${href}`);
}

export function useSelectedLayoutSegment() {
  const pathname = usePathname();
  return useMemo(() => pathname.split("/").filter(Boolean)[0] ?? null, [pathname]);
}
