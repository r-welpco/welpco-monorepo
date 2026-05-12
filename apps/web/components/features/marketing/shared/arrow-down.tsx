/**
 * Decorative arrow icon — faithful port of `.design-reference/project/components/shared.jsx` `ArrowDown`.
 */
export function ArrowDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 6l4 4 4-4M7 1v9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
