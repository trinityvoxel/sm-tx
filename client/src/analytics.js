export function trackPageView(path) {
  if (path.startsWith('/admin') || typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: path,
  });
}

export function trackEvent(name, parameters = {}) {
  if (window.location.pathname.startsWith('/admin') || typeof window.gtag !== 'function') return;
  window.gtag('event', name, parameters);
}
