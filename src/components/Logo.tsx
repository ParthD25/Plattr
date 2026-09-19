// The Plattr mark: a heart-shaped strawberry, as in the team's design. Shared file: builders import, do not edit.
export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Plattr logo: a heart-shaped strawberry">
      <path d="M32 59C13 45.500 5 34 5 23.500 5 14.500 11.800 8 20 8c5 0 9.400 2.500 12 6.600C34.600 10.500 39 8 44 8c8.200 0 15 6.500 15 15.500C59 34 51 45.500 32 59z" fill="#e0322f" />
      <path d="M13 21c1-5 5-8 9-8" fill="none" stroke="#ff8f86" strokeWidth="3" strokeLinecap="round" />
      <g fill="#ffe9a8">
        <ellipse cx="20" cy="27" rx="1.500" ry="2.300" /><ellipse cx="32" cy="25" rx="1.500" ry="2.300" /><ellipse cx="44" cy="27" rx="1.500" ry="2.300" />
        <ellipse cx="26" cy="36" rx="1.500" ry="2.300" /><ellipse cx="38" cy="36" rx="1.500" ry="2.300" /><ellipse cx="32" cy="46" rx="1.500" ry="2.300" />
        <ellipse cx="16" cy="36" rx="1.300" ry="2" /><ellipse cx="48" cy="36" rx="1.300" ry="2" />
      </g>
      <g fill="#2e9e44">
        <path d="M32 19C29.500 11 22 7.500 14.500 9.500 17 16 23.500 19.800 32 19z" />
        <path d="M32 19c2.500-8 10-11.500 17.500-9.500C47 16 40.500 19.800 32 19z" />
        <path d="M32 20c-4.500-5.500-4.500-12 0-17 4.500 5 4.500 11.500 0 17z" fill="#1f8a3b" />
      </g>
      <path d="M32 3.500V16" stroke="#1f6f3a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
