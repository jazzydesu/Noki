function Icon({ name, size = 20 }) {
  const paths = {
    home: <path d="M3 10.5 10 4l7 6.5v6.25a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 5 16.75V10.5Zm4.5 7.5v-4h5v4" />,
    forecast: <><circle cx="10" cy="10" r="6.5" /><path d="M10 6v4l2.5 1.5M10 1v1M10 18v1M1 10h1M18 10h1" /></>,
    saved: <path d="m10 3 2.05 4.16 4.59.67-3.32 3.24.78 4.57L10 13.48l-4.1 2.16.78-4.57-3.32-3.24 4.59-.67L10 3Z" />,
    settings: <><circle cx="10" cy="10" r="3" /><path d="M10 1.75v2M10 16.25v2M1.75 10h2M16.25 10h2M4.16 4.16l1.42 1.42M14.42 14.42l1.42 1.42M15.84 4.16l-1.42 1.42M5.58 14.42l-1.42 1.42" /></>,
    close: <path d="m5 5 10 10M15 5 5 15" />,
    pin: <><path d="M10 17s5-4.19 5-8.5a5 5 0 0 0-10 0C5 12.81 10 17 10 17Z" /><circle cx="10" cy="8.5" r="1.5" /></>,
    clear: <><circle cx="10" cy="10" r="3.5" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.34 4.34l1.42 1.42M14.24 14.24l1.42 1.42M15.66 4.34l-1.42 1.42M5.76 14.24l-1.42 1.42" /></>,
    partly: <><circle cx="7" cy="8" r="3" /><path d="M7 2.5v1M7 12.5v1M1.5 8h1M11.5 8h1M3.1 4.1l.7.7M10.2 11.2l.7.7M14.5 14.5h-7a2.5 2.5 0 1 1 .6-4.93A3.5 3.5 0 0 1 14.5 14.5Z" /></>,
    overcast: <path d="M5.5 15.5h9a3 3 0 1 0-.5-5.96A4.5 4.5 0 0 0 5.5 11a2.25 2.25 0 0 0 0 4.5Z" />,
  }

  return <svg className="icon" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default Icon
