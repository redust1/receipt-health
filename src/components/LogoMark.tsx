export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Green rounded-square background */}
      <rect width="44" height="44" rx="11" fill="#4CAF50" />
      {/* White receipt paper */}
      <rect x="11" y="9" width="22" height="27" rx="3" fill="white" opacity="0.97" />
      {/* EKG / heartbeat line across receipt */}
      <path
        d="M13 22 L16.5 22 L18 17.5 L20 26.5 L21.5 22 L31 22"
        stroke="#4CAF50"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Receipt item lines at bottom */}
      <line x1="13" y1="29" x2="26" y2="29" stroke="#A5D6A7" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="32" x2="20" y2="32" stroke="#A5D6A7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
