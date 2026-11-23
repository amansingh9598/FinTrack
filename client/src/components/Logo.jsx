export default function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="24" fill="#0F766E" />
        <path d="M22 68 40 48l14 12 24-28" stroke="#F4A31B" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>FinTrack</span>
    </span>
  );
}
