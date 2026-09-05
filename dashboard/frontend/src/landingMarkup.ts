/**
 * WEFT marketing landing page — static markup.
 *
 * Ported verbatim from the design artifact (letterpress identity). Kept as an
 * HTML string and rendered with dangerouslySetInnerHTML so the port stays 1:1
 * with the source; it carries no user input. Styling lives in landing.css
 * (scoped under `.weft-landing`); the small amount of behaviour — mobile nav,
 * scroll reveal, active-nav highlight — is wired up in LandingPage.tsx.
 *
 * The only edits from the artifact: the three call-to-action links now point
 * at the real Google sign-in route instead of the prototype artifact URL.
 */
const SIGNIN = '/api/auth/google/login';

export const LANDING_HTML = `
<nav class="nav">
  <div class="wrap nav__in">
    <a class="brand" href="#top">
      <span class="mk" aria-hidden="true"><img src="/weft-mark.png" alt="" /></span>
      WEFT
    </a>
    <div class="nav__links" id="navLinks">
      <a href="#top" class="is-active">Home</a>
      <a href="#sync">Product</a>
      <a href="#how">How It Works</a>
      <a href="#proof">Use Cases</a>
      <a href="#features">Features</a>
    </div>
    <div class="nav__cta">
      <a class="btn btn--primary" href="${SIGNIN}">Get Started</a>
      <button class="nav__toggle" id="navToggle" aria-label="Menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
    </div>
  </div>
</nav>

<!-- ===================== HERO ===================== -->
<header class="band hero" id="top">
  <div class="wrap">
    <div class="hero__grid">
      <div class="reveal">
        <span class="chip chip--green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/></svg>
          AI-powered work context
        </span>
        <h1 class="display">One goal.<br />Every device.<br />One continuous <span class="g">workflow.</span></h1>
        <p class="lede">WEFT turns your goals into live workflows, connects your phone, laptop and browser, and preserves your work state so you can resume exactly where you left off.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${SIGNIN}">Try WEFT for Free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <a class="btn btn--ghost" href="#how">See How It Works
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>
          </a>
        </div>
        <div class="hero__proof">
          <span class="avatars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          Loved by 12,000+ focused users
        </div>
      </div>

      <div class="devstack reveal" aria-hidden="true">
        <svg class="flowfx" viewBox="0 0 600 520" fill="none" preserveAspectRatio="xMidYMid slice">
          <g stroke="var(--green)" stroke-width="1.4">
            <path d="M40 120 C 200 90, 260 210, 470 150" />
            <path d="M20 250 C 220 240, 300 280, 520 260" />
            <path d="M60 380 C 220 360, 280 300, 500 360" />
          </g>
          <g stroke="var(--orange)" stroke-width="1.2">
            <path d="M30 200 C 180 260, 300 420, 540 400" />
            <path d="M50 320 C 200 420, 320 470, 520 470" />
          </g>
          <g fill="var(--green)">
            <circle cx="470" cy="150" r="2.5"/><circle cx="520" cy="260" r="2.5"/><circle cx="500" cy="360" r="2.5"/>
            <circle cx="180" cy="150" r="1.8"/><circle cx="260" cy="255" r="1.8"/><circle cx="240" cy="360" r="1.8"/>
          </g>
        </svg>

        <div class="dv dv--phone">
          <div class="dv__meta"><div class="t">Phone</div><div class="s">Control &amp; Focus</div></div>
          <div class="dv__screen">
            <div class="minibar"><i></i><i></i><i></i> WEFT</div>
            <div class="mini-lbl">Study Focus</div>
            <div class="mini-row on"><span class="k">●</span> Active</div>
            <div class="mini-lbl">Allowed</div>
            <div class="mini-row"><span class="k">✓</span> Family</div>
            <div class="mini-row"><span class="k">✓</span> Emergency</div>
            <div class="mini-lbl">Muted</div>
            <div class="mini-row"><span class="k">×</span> Social · Shopping</div>
          </div>
        </div>

        <div class="dv" style="margin-left:36px">
          <div class="dv__meta"><div class="t">Laptop</div><div class="s">Execute Work</div></div>
          <div class="dv__screen">
            <div class="minibar"><i></i><i></i><i></i> cnf-practice.md — WEFT</div>
            <div class="code-ln g"></div>
            <div class="code-ln w80"></div>
            <div class="code-ln w55"></div>
            <div class="code-ln g w40"></div>
            <div class="code-ln w70"></div>
            <div class="code-ln w55"></div>
            <div class="code-ln w80"></div>
          </div>
        </div>

        <div class="dv" style="margin-left:12px">
          <div class="dv__meta"><div class="t">Browser</div><div class="s">Context &amp; Capture</div></div>
          <div class="dv__screen">
            <div class="minibar"><i></i><i></i><i></i> WEFT</div>
            <div class="mini-lbl">Current Task</div>
            <div class="mini-val">FLA Exam Preparation</div>
            <div class="mini-lbl">Current Step</div>
            <div class="mini-val" style="color:var(--green-deep);font-weight:700">CNF Conversion</div>
            <div class="mini-btn">Save Reference</div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats reveal" style="margin-top:clamp(48px,7vw,80px)">
      <div class="stat">
        <svg class="stat__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M16 6.5a3 3 0 0 1 0 5.5M18.5 19c0-2.4-1.4-4.2-3.3-4.8"/></svg>
        <div><div class="stat__n">25K+</div><div class="stat__l">Active Users</div></div>
      </div>
      <div class="stat">
        <svg class="stat__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>
        <div><div class="stat__n">120K+</div><div class="stat__l">Workflows Created</div></div>
      </div>
      <div class="stat">
        <svg class="stat__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>
        <div><div class="stat__n">3.6M+</div><div class="stat__l">Hours Saved</div></div>
      </div>
      <div class="stat">
        <svg class="stat__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
        <div><div class="stat__n">99.2%</div><div class="stat__l">Focus Improvement</div></div>
      </div>
    </div>
  </div>
</header>

<!-- ===================== PROBLEM / SOLUTION ===================== -->
<section class="band band--raise" id="how">
  <div class="wrap">
    <div class="ps-grid">
      <div class="reveal">
        <span class="chip chip--orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 16H3l9-16zM12 10v4M12 17h.01"/></svg>
          The problem
        </span>
        <h2 class="display" style="margin-top:16px">Your tools remember tasks.<br />They <span class="o">don't remember</span> your work.</h2>
        <p class="lede" style="margin-top:14px">Context gets lost. Tabs get buried. Notes get scattered. Starting again takes more time than doing the work.</p>

        <ul class="prob-list">
          <li>
            <span class="prob-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="8" height="6" rx="1"/><rect x="13" y="9" width="8" height="6" rx="1"/><rect x="6" y="15" width="8" height="6" rx="1"/></svg></span>
            <div><div class="pt">Scattered tabs</div><div class="ps">Information everywhere</div></div>
          </li>
          <li>
            <span class="prob-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg></span>
            <div><div class="pt">Lost context</div><div class="ps">Forgot where you left off</div></div>
          </li>
          <li>
            <span class="prob-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h16"/><path d="M17 10l4 4-4 4"/></svg></span>
            <div><div class="pt">Constant interruptions</div><div class="ps">Break your focus</div></div>
          </li>
          <li>
            <span class="prob-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"/></svg></span>
            <div><div class="pt">Start from scratch</div><div class="ps">Every single time</div></div>
          </li>
          <span class="ps-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </ul>
      </div>

      <div class="reveal">
        <span class="chip chip--green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7L10 17l-5-5"/></svg>
          The solution
        </span>
        <h2 class="display" style="margin-top:16px">WEFT keeps the context <span class="g">connected.</span></h2>

        <div class="pipe" style="margin-top:22px" aria-hidden="true">
          <div class="pipe__node k"><span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6M4.9 7l4.2 2.4M19.1 7l-4.2 2.4M12 22a7 7 0 0 0 0-14 7 7 0 0 0 0 14z"/></svg></span><span>Goal</span></div>
          <div class="pipe__node"><span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 8.5v7M8.3 6h4.7a3 3 0 0 1 3 3M8.3 18h4.7a3 3 0 0 0 3-3"/></svg></span><span>Workflow</span></div>
          <div class="pipe__node"><span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/></svg></span><span>Work</span></div>
          <div class="pipe__node"><span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h10M4 12h16M4 18h10"/></svg></span><span>Context</span></div>
          <div class="pipe__node"><span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg></span><span>State</span></div>
          <div class="pipe__node"><span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h14M12 6l6 6-6 6"/></svg></span><span>Next Action</span></div>
          <div class="pipe__node k"><span class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v6h6M20 20v-6h-6"/><path d="M20 10a8 8 0 0 0-14-4M4 14a8 8 0 0 0 14 4"/></svg></span><span>Resume</span></div>
        </div>

        <div class="egflow">
          <div class="h">Example Workflow &nbsp;·&nbsp; <span style="color:var(--dim);font-weight:500;font-style:italic">"Prepare for my FLA exam."</span></div>
          <div class="egrows">
            <div class="done"><span class="m">✓</span> Study CFG</div>
            <div class="now"><span class="m">→</span> CNF Conversion</div>
            <div class="done"><span class="m">✓</span> Regular Expressions</div>
            <div class="todo"><span class="m">○</span> Solve PYQs</div>
            <div class="todo" style="grid-column:2"><span class="m">○</span> Review &amp; Complete</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== SYNC ===================== -->
<section class="band" id="sync">
  <div class="wrap">
    <div class="sync-grid">
      <div class="reveal">
        <span class="chip chip--green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8a8 8 0 0 1 14-4M4 8V4M4 8h4M20 16a8 8 0 0 1-14 4M20 16v4M20 16h-4"/></svg>
          Cross-device sync
        </span>
        <h2 class="display" style="margin-top:16px;font-size:clamp(1.8rem,4vw,2.6rem)">Your work, in sync.<br /><span class="g">Always.</span></h2>
        <p class="lede" style="margin-top:14px">Start on your phone, continue on your laptop, research in your browser. WEFT keeps everything connected.</p>

        <div class="sync-feats">
          <div class="sync-feat">
            <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/><circle cx="12" cy="12" r="2.5"/></svg></span>
            <div><div class="t">Seamless handoff</div><div class="s">Pick up instantly across devices</div></div>
          </div>
          <div class="sync-feat">
            <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h10M4 12h16M4 18h7"/><circle cx="18" cy="17" r="3"/></svg></span>
            <div><div class="t">Live context</div><div class="s">Tabs, notes and references stay linked</div></div>
          </div>
          <div class="sync-feat">
            <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg></span>
            <div><div class="t">Smart focus</div><div class="s">Your phone adapts to your work</div></div>
          </div>
        </div>
      </div>

      <div class="reveal">
        <div class="sync-stage">
          <div class="stage-card">
            <div class="minibar"><i></i><i></i><i></i> WEFT</div>
            <div class="kv"><span class="k">Current Work</span><span class="v">FLA Exam Preparation</span></div>
            <div class="kv"><span class="k">Progress</span><span class="v g">4 / 7 steps</span></div>
            <div class="mini-prog"><i></i></div>
            <div class="kv"><span class="k">Current Step</span><span class="v">CNF Conversion</span></div>
            <div class="mini-btn">Resume Work</div>
          </div>

          <div class="stage-card stage-card--main">
            <div class="minibar"><i></i><i></i><i></i> WEFT &nbsp;·&nbsp; Active session · 42m</div>
            <div class="stage-title">FLA Exam Preparation</div>
            <div class="kv"><span class="k">Progress · 4 / 7 steps</span></div>
            <div class="mini-prog"><i></i></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px">
              <div>
                <div class="kv"><span class="k">Current Step</span><span class="v g">CNF Conversion</span></div>
                <div class="kv"><span class="k">Last Activity</span><span class="v">Solved example 1</span></div>
                <div class="kv"><span class="k">Next</span><span class="v">Complete example 2</span></div>
              </div>
              <div>
                <div class="kv"><span class="k">References</span></div>
                <div class="reflist"><span>CNF Tutorial.pdf</span><span>Example Sheet.docx</span><span>Lecture Notes.pdf</span></div>
              </div>
            </div>
          </div>

          <div class="stage-card">
            <div class="minibar"><i></i><i></i><i></i> WEFT</div>
            <div class="kv"><span class="k">Current Task</span><span class="v">FLA Exam Preparation</span></div>
            <div class="kv"><span class="k">Step</span><span class="v">CNF Conversion</span></div>
            <div class="kv"><span class="k">This Page</span><span class="v">CNF Tutorial</span></div>
            <div class="mini-btn">Save Reference</div>
            <div class="kv" style="margin-top:10px"><span class="k">Next Action</span><span class="v">Complete example 2</span></div>
          </div>

          <div class="sync-weave" aria-hidden="true">
            <div class="ln"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:10px"><path d="M9 9V6.5a2.5 2.5 0 1 0-2.5 2.5H9zm0 0h6m-6 0v6m6-6V6.5A2.5 2.5 0 1 1 17.5 9H15zm0 0v6m0 0h2.5A2.5 2.5 0 1 1 15 17.5V15zm0 0H9m0 0v2.5A2.5 2.5 0 1 1 6.5 15H9z"/></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== SOCIAL PROOF ===================== -->
<section class="band band--raise" id="proof">
  <div class="wrap">
    <span class="chip reveal" style="margin-bottom:26px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></svg>
      Trusted worldwide
    </span>
    <div class="proof-grid reveal">
      <div class="proof-cell">
        <h3 class="display">Built for deep work.<br />Loved by thousands.</h3>
        <p>From students to professionals, WEFT helps people stay focused and finish what matters.</p>
      </div>
      <div class="proof-cell proof-big">
        <div class="n">98%</div>
        <div class="c">of users say WEFT helps them resume work 10&times; faster</div>
        <div class="stars" aria-label="4.9 out of 5">★★★★★</div>
        <div class="c">4.9 / 5 from 1,240+ reviews</div>
      </div>
      <div class="proof-cell proof-quote">
        <p class="q">"WEFT remembers everything so I can focus on thinking, not managing my work."</p>
        <div class="who">
          <span class="pic" aria-hidden="true">AN</span>
          <div><div class="nm">Arjun N.</div><div class="rl">Computer Science Student</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== FEATURES ===================== -->
<section class="band" id="features">
  <div class="wrap">
    <div class="feat-top">
      <div class="reveal">
        <span class="chip chip--green" style="margin-bottom:16px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z"/></svg>
          What WEFT does
        </span>
        <h2 class="display">Everything your workflow needs.<br /><span class="g">Nothing you don't.</span></h2>
        <p class="lede" style="margin-top:14px">Powerful features. Simple experience.</p>
      </div>

      <div class="feat-grid reveal">
        <div class="feat">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 8.5v7M8.3 6h4.7a3 3 0 0 1 3 3M8.3 18h4.7a3 3 0 0 0 3-3"/></svg></span>
          <h4>AI Workflow Builder</h4>
          <p>Turn any goal into a smart step-by-step plan.</p>
        </div>
        <div class="feat">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l3 3v15l-6-3-6 3V3z"/></svg></span>
          <h4>Context Capture</h4>
          <p>Save tabs, notes and references effortlessly.</p>
        </div>
        <div class="feat">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg></span>
          <h4>Work State Engine</h4>
          <p>Never lose track of where you are in your work.</p>
        </div>
        <div class="feat">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2M7 8h10"/></svg></span>
          <h4>Focus Bridge</h4>
          <p>Your phone supports your deep work.</p>
        </div>
        <div class="feat">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8a8 8 0 0 1 14-4M4 8V4M4 8h4M20 16a8 8 0 0 1-14 4M20 16v4M20 16h-4"/></svg></span>
          <h4>Cross-Device Sync</h4>
          <p>Real-time sync across all your devices.</p>
        </div>
        <div class="feat">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg></span>
          <h4>Privacy First</h4>
          <p>Your data stays private and secure.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== FINAL CTA ===================== -->
<section class="band final">
  <div class="wrap reveal">
    <h2 class="display">Your work has a state.<br /><span class="g">WEFT keeps it connected.</span></h2>
    <p class="lede">Powerful features. Simple experience. Start a workflow and never lose your place again.</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn btn--primary" href="${SIGNIN}">Start Your Workflow
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </div>
    <p class="sub">No credit card required &nbsp;·&nbsp; Free forever</p>
  </div>
</section>

<footer class="foot">
  <div class="wrap foot__in">
    <span class="brand">
      <span class="mk" aria-hidden="true"><img src="/weft-mark.png" alt="" /></span>
      WEFT
    </span>
    <div class="foot__links">
      <a href="#how">How it works</a>
      <a href="#sync">Product</a>
      <a href="#features">Features</a>
      <a href="#proof">Reviews</a>
    </div>
    <p class="foot__note">One goal · every device · one continuous workflow &nbsp;—&nbsp; prototype with example data (FLA Exam Preparation)</p>
  </div>
</footer>
`;
