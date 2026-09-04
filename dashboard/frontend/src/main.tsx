import React, {lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {PrivacyPolicy} from './PrivacyPolicy.tsx';
import './index.css';

// No router in this app — a single path check is enough for the few static
// pages we need. nginx (try_files ... /index.html) serves index.html for any
// path, so the SPA boots and this picks it up.
//
// /welcome is the WEFT marketing landing page. It carries its own letterpress
// stylesheet (landing.css) and web fonts, so it's lazy-loaded to keep all of
// that out of the dashboard bundle.
const LandingPage = lazy(() => import('./LandingPage.tsx'));

const path = window.location.pathname.replace(/\/+$/, '');

let Root: React.JSX.Element;
if (path === '/privacy') {
  Root = <PrivacyPolicy />;
} else if (path === '/welcome') {
  Root = (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
} else {
  Root = <App />;
}

createRoot(document.getElementById('root')!).render(Root);
