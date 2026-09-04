import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {PrivacyPolicy} from './PrivacyPolicy.tsx';
import './index.css';

// No router in this app — a single path check is enough for the one static
// page we need. nginx (try_files ... /index.html) serves index.html for
// /privacy, so the SPA boots and this picks it up.
const path = window.location.pathname.replace(/\/+$/, '');
const Root = path === '/privacy' ? <PrivacyPolicy /> : <App />;

createRoot(document.getElementById('root')!).render(Root);
