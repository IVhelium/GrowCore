import { useState } from "react";
import { FileImage } from "lucide-react";

export default function ImageWithFallback({
  src,
  alt = "",
  className = "",
  iconSize = 28,
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`grid place-items-center bg-slate-100 text-slate-400 ${className}`}
        role="img"
        aria-label={alt || "Image not available"}
      >
        <FileImage size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
