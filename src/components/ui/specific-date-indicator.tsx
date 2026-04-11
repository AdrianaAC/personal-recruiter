type SpecificDateIndicatorProps = {
  className?: string;
};

export function SpecificDateIndicator({
  className = "h-3.5 w-3.5 text-amber-500",
}: SpecificDateIndicatorProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="m12 2.8 2.5 5 5.5.8-4 3.9.9 5.5L12 15.4 7.1 18l.9-5.5-4-3.9 5.5-.8 2.5-5Z" />
    </svg>
  );
}
