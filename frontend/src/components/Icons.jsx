const iconProps = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function IconBolt(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

export function IconBell(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export function IconCompass(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

export function IconTarget(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function IconLayers(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

export function IconGlobe(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

export function IconStar({ filled, ...props }) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" />
    </svg>
  );
}

export function IconX(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconTrend(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  );
}

export function IconSpark(props) {
  return (
    <svg {...iconProps} {...props} viewBox="0 0 24 24">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
