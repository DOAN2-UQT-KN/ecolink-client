import type { ImgHTMLAttributes } from "react";

type AppImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  unoptimized?: boolean;
};

export default function AppImage({
  fill,
  priority: _priority,
  sizes: _sizes,
  quality: _quality,
  unoptimized: _unoptimized,
  className = "",
  style,
  alt = "",
  ...props
}: AppImageProps) {
  if (fill) {
    return (
      <img
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className}`.trim()}
        style={style}
        {...props}
      />
    );
  }

  return <img alt={alt} className={className} style={style} {...props} />;
}
