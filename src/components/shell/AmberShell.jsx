/* AmberShell — "Luxury Noir"
   Sidebar #0A0A0A with gold hairline dividers. Serif display headings.
   Labels uppercase, letter-spacing 0.12em. Generous padding.
   Composer: black with 1px gold border.
   Slots: { nav, header, main, composer } */
export default function AmberShell({ nav, header, main, composer }) {
  return (
    <div className="shell shell-amber">
      <aside className="am-sidebar" aria-label="Conversations">
        <div className="am-brand">
          JepongDevxyz <em>AI</em>
        </div>
        <div className="am-hairline" aria-hidden="true" />
        {nav}
        <div className="am-hairline" aria-hidden="true" />
        <span className="am-label">Luxury Noir</span>
      </aside>

      <div className="am-body">
        <header className="am-header">
          <h1>Evening, Jepong</h1>
          {header}
        </header>
        <main className="am-main">{main}</main>
        <div className="am-composer">{composer}</div>
      </div>
    </div>
  );
}
