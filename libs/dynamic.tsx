import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => ReactNode;
};

export default function dynamic<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const LazyComponent: LazyExoticComponent<ComponentType<P>> = lazy(loader);
  const fallback = options.loading?.() ?? null;

  const DynamicComponent = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return DynamicComponent;
}
