interface BrandMarkProps {
  className?: string;
  alt?: string;
}

export function BrandMark({ className = '', alt = '' }: BrandMarkProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white p-1 ${className}`}
      style={{ borderRadius: '2px' }}
    >
      <img
        src="/aegis-emblem.png"
        alt={alt}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}
