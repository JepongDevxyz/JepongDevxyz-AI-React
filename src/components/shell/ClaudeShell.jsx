/* ClaudeShell — Claude app style (pixel direction: Anthropic Claude)
   Warm cream paper #F4F3EE, coral/terracotta accent #C96442, dark ink
   text, SERIF display headings (Georgia), starburst-inspired mark,
   greeting "Good morning, Jepong". Minimal chrome, calm and warm.
   Light-first (may dark mode). IBA ito sa muse-minimal.
   Brand: ClaudeMark (carbon copy starburst) sa sidebar, header,
   greeting, composer send.
   Slots: { nav, header, main, composer } */
import ClaudeMark from "../brand/ClaudeMark.jsx";

export default function ClaudeShell({ nav, header, main, composer }) {
  return (
    <div className="shell shell-claude">
      <aside className="cl-sidebar" aria-label="Conversations">
        <span className="cl-mark" style={{ marginBottom: 8 }}>
          <ClaudeMark size={36} />
        </span>
        {nav}
      </aside>

      <div className="cl-body">
        <header className="cl-top">
          <ClaudeMark size={22} />
          {header}
        </header>

        <main className="cl-main">
          <h1 className="cl-greeting">
            <ClaudeMark size={34} className="cl-greeting__mark" />
            <span>
              Good morning, <span className="cl-name">Jepong</span>
            </span>
          </h1>
          <p className="cl-sub">How can I help you today?</p>
          {main}
        </main>

        <div className="cl-composer">{composer}</div>
      </div>
    </div>
  );
}
