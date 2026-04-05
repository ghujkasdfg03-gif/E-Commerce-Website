import type { CSSProperties, ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

export default function Image({
  fill,
  style,
  className,
  alt,
  src,
  ...props
}: ImageProps) {
  const mergedStyle: CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }
    : { ...style };

  return (
    <img
      {...props}
      src={typeof src === "string" ? src : ""}
      alt={alt ?? ""}
      className={className}
      style={mergedStyle}
    />
  );
}
