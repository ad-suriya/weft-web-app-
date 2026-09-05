import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './landing.css';
import { LANDING_HTML } from './landingMarkup';

interface LandingPageProps {
  // Set when a sign-in attempt bounced back with an error — App.tsx renders
  // this page in place of the old login screen, so the message surfaces here.
  // This is a stable, user-safe CODE from the backend (e.g. "sign_in_failed",
  // "invalid_state", "access_denied") — never the raw exception text. The
  // backend logs the real detail server-side; only a friendly message ever
  // reaches this component. See AUTH_ERROR_COPY below.
  authError?: string;
}

// Maps the backend's auth_error codes to copy a user should actually see.
// Anything unrecognized (including, historically, a raw exception string from
// before this was fixed) falls back to the generic message rather than ever
// rendering internal detail like "Token used too early, 1788611836 < 1788611837".
const AUTH_ERROR_COPY: Record<string, string> = {
  access_denied: "Sign-in was cancelled. You're welcome to try again anytime.",
  invalid_state: 'Your sign-in session could not be verified. Please try again.',
  sign_in_failed: 'Your sign-in session could not be verified. Please try again.',
};
const DEFAULT_AUTH_ERROR_MESSAGE = 'Your sign-in session could not be verified. Please try again.';

// WEFT marketing landing page. Rendered by App.tsx as the signed-out home page
// and by main.tsx at /welcome. Static content ported from the design artifact —
// rendered via dangerouslySetInnerHTML to keep the port 1:1 with the source;
// styling is in landing.css, scoped under `.weft-landing`. This effect wires
// the same small behaviours the artifact's inline script had: mobile nav,
// scroll reveal, and the active section highlight in the nav.
export default function LandingPage({ authError }: LandingPageProps = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A fresh authError (new sign-in attempt) should reset any earlier dismissal.
  useEffect(() => setDismissed(false), [authError]);

  const retry = () => {
    window.location.href = '/api/auth/google/login';
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.classList.remove('no-js');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups: Array<() => void> = [];

    // Sign-in CTAs ("Get Started" / "Try WEFT for Free" / "Start Your
    // Workflow") are plain <a href="/api/auth/google/login"> — a real
    // full-page redirect into the backend's OAuth flow, not a fetch(), so
    // there's no JS request to "cancel" on a double-click. What a rapid
    // second click CAN do is fire a second navigation that races the first,
    // which is the actual "multiple simultaneous OAuth requests" risk here.
    // Guard it the same way the rest of this effect wires up plain DOM
    // behaviour: freeze the clicked button's label/interactivity so a second
    // click on it (or any of the others) is a no-op once one is in flight.
    const signInLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href="/api/auth/google/login"]'));
    if (signInLinks.length) {
      let navigating = false;
      const onSignInClick = (e: Event) => {
        if (navigating) {
          e.preventDefault();
          return;
        }
        navigating = true;
        signInLinks.forEach((a) => {
          a.dataset.originalLabel = a.textContent ?? '';
          a.textContent = 'Signing in…';
          a.classList.add('is-authenticating');
          a.setAttribute('aria-disabled', 'true');
          if (a !== (e.currentTarget as HTMLAnchorElement)) a.style.pointerEvents = 'none';
        });
      };
      signInLinks.forEach((a) => a.addEventListener('click', onSignInClick));
      cleanups.push(() => signInLinks.forEach((a) => a.removeEventListener('click', onSignInClick)));
    }

    // Scroll progress bar + nav elevation — both purely visual, driven by
    // one shared scroll listener rather than two.
    const progressBar = document.querySelector<HTMLElement>('.weft-scroll-progress');
    const nav = root.querySelector<HTMLElement>('.nav');
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      if (progressBar) progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, pct))})`;
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));

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
      <div className="weft-scroll-progress" aria-hidden="true" />
      <AnimatePresence>
        {authError && !dismissed && (
          <motion.div
            className="weft-auth-alert-wrap"
            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <motion.div
              role="alert"
              className="weft-auth-alert"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.25, delay: reduced ? 0 : 0.05 }}
            >
              <svg className="weft-auth-alert__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="weft-auth-alert__body">
                <p className="weft-auth-alert__title">Sign-in couldn&apos;t be completed</p>
                <p className="weft-auth-alert__message">{AUTH_ERROR_COPY[authError] ?? DEFAULT_AUTH_ERROR_MESSAGE}</p>
                <button type="button" className="weft-auth-alert__retry" onClick={retry}>
                  Try Again
                </button>
              </div>
              <button
                type="button"
                className="weft-auth-alert__dismiss"
                aria-label="Dismiss"
                onClick={() => setDismissed(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={rootRef}
        className="weft-landing no-js"
        dangerouslySetInnerHTML={{ __html: LANDING_HTML }}
      />
    </>
  );
}
