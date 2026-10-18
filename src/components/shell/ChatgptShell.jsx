/* ChatgptShell — ChatGPT app style (pixel direction: OpenAI ChatGPT)
   Sidebar (dark #171717 default, light option) with "New chat" button,
   search, history list. Top bar with model picker "ChatGPT ▾". Centered
   greeting "What can I help with?". Centered pill composer
   "Message ChatGPT". Monochrome, minimal, Inter-like.
   Brand: ChatGPTMark (carbon copy blossom) sa sidebar, New chat, picker.
   Slots: { nav, header, main, composer } */
import { ChevronDown, Search } from "lucide-react";
import ChatGPTMark from "../brand/ChatGPTMark.jsx";

export default function ChatgptShell({ nav, header, main, composer }) {
  return (
    <div className="shell shell-chatgpt">
      <aside className="cg-sidebar" aria-label="History">
        <button type="button" className="cg-newchat">
          <ChatGPTMark size={18} />
          New chat
        </button>
        <button type="button" className="cg-search">
          <Search size={18} strokeWidth={1.8} />
          Search chats
        </button>
        {nav}
      </aside>

      <div className="cg-body">
        <header className="cg-topbar">
          <button type="button" className="cg-picker" aria-label="Choose model">
            <ChatGPTMark size={20} />
            ChatGPT
            <ChevronDown size={18} strokeWidth={2} />
          </button>
          <div style={{ flex: 1 }} />
          {header}
        </header>

        <main className="cg-main">
          {main}
        </main>

        <div className="cg-composer">{composer}</div>
      </div>
    </div>
  );
}
