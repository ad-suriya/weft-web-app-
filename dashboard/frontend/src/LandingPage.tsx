import React, { useEffect, useRef } from 'react';
import './landing.css';
import { LANDING_HTML } from './landingMarkup';

interface LandingPageProps {
  // Set when a sign-in attempt bounced back with an error — App.tsx renders
  // this page in place of the old login screen, so the message surfaces here.
  authError?: string;
}

// WEFT marketing landing page. Rendered by App.tsx as the signed-out home page
// and by main.tsx at /welcome. Static content ported from the design artifact —
// rendered via dangerouslySetInnerHTML to keep the port 1:1 with the source;
// styling is in landing.css, scoped under `.weft-landing`. This effect wires
// the same small behaviours the artifact's inline script had: mobile nav,
// scroll reveal, and the active section highlight in the nav.
export default function LandingPage({ authError }: LandingPageProps = {}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.classList.remove('no-js');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups: Array<() => void> = [];

    // Mobile nav toggle.
    const toggle = root.querySelector<HTMLButtonElement>('#navToggle');
    const links = root.querySelector<HTMLDivElement>('#navLinks');
    if (toggle && links) {
      const onToggle = () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      };
      const onLinkClick = (e: Event) => {
        if ((e.target as HTMLElement).tagName === 'A') {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      };
      toggle.addEventListener('click', onToggle);
      links.addEventListener('click', onLinkClick);
      cleanups.push(() => {
        toggle.removeEventListener('click', onToggle);
        links.removeEventListener('click', onLinkClick);
      });
    }

    // Scroll reveal — sections are readable at rest; this only removes the
    // small translate offset as each one enters the viewport.
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
      );
      revealEls.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }

    // Active-section highlight in the nav.
    const navAnchors = Array.from(root.querySelectorAll<HTMLAnchorElement>('#navLinks a[href^="#"]'));
    const sections = ['top', 'how', 'sync', 'proof', 'features']
      .map((id) => root.querySelector<HTMLElement>(`#${id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if ('IntersectionObserver' in window && sections.length) {
      const sio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navAnchors.forEach((a) =>
              a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`),
            );
          });
        },
        { threshold: 0.4, rootMargin: '-30% 0px -50% 0px' },
      );
      sections.forEach((s) => sio.observe(s));
      cleanups.push(() => sio.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <>
      {authError && (
        <div
          role="alert"
          style={{
            background: '#D14D2A',
            color: '#fff',
            font: '700 12px/1.4 "Inter", system-ui, sans-serif',
            letterSpacing: '0.04em',
            textAlign: 'center',
            padding: '10px 16px',
          }}
        >
          Sign-in failed: {authError}
        </div>
      )}
      <div
        ref={rootRef}
        className="weft-landing no-js"
        dangerouslySetInnerHTML={{ __html: LANDING_HTML }}
      />
    </>
  );
}
