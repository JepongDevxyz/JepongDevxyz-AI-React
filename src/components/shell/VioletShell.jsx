/* VioletShell — "Energy"
   Deep-violet sidebar. Header with violet gradient wash. Rounded-3xl
   cards. Pill buttons. Violet-tinted shadows.
   Slots: { nav, header, main, composer } */
export default function VioletShell({ nav, header, main, composer }) {
  return (
    <div className="shell shell-violet">
      <aside className="vi-sidebar" aria-label="Conversations">
        {nav}
      </aside>

      <div className="vi-body">
        <header className="vi-header">{header}</header>
        <main className="vi-main">{main}</main>
        <div className="vi-composer">{composer}</div>
      </div>
    </div>
  );
}
