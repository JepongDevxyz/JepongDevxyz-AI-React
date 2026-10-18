/* MapsPanel — standalone Maps tool (keyless embed).
   Input ng location/query → naka-embed na mapa (Google Maps output=embed;
   gumagana nang walang API key). Ang MAP_URL marker mula sa chat (Phase 2
   marker pipeline → MapCard) ay nananatiling autoembed sa chat — ito ang
   standalone tool na bersyon. */
import { useState } from "react";
import { MapPin, ExternalLink, Search } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { pushComposerDraft } from "../chat/Composer.jsx";
import { useToast } from "../../state/ToastContext.jsx";

function embedUrl(q) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

function openUrl(q) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export default function MapsPanel({ onClose }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState("");

  const search = () => {
    const q = query.trim();
    if (!q) return;
    setShown(q);
  };

  const askInChat = () => {
    if (!shown) return;
    pushComposerDraft(`Ipakita mo ang mapa ng ${shown}`);
    toast("Nailagay sa composer — itanong sa AI para sa live map card");
    onClose?.();
  };

  return (
    <Modal open onClose={onClose} title="Maps" wide>
      <div className="jd-cap-stack">
        <div className="jd-cap-addrow">
          <input
            className="jd-cap-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") search();
            }}
            placeholder="Maghanap ng lugar… (hal. Makati, Philippines)"
            maxLength={200}
            aria-label="Hanapin sa mapa"
          />
          <button type="button" className="jd-cap-btn" onClick={search} disabled={!query.trim()}>
            <Search size={16} /> Hanapin
          </button>
        </div>

        {shown ? (
          <>
            <div className="jd-mapwrap">
              <iframe
                title={`Mapa ng ${shown}`}
                src={embedUrl(shown)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="jd-cap-row">
              <a
                className="jd-cap-btn jd-cap-btn--ghost"
                href={openUrl(shown)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={15} /> Buksan sa Google Maps
              </a>
              <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={askInChat}>
                <MapPin size={15} /> Itanong sa chat
              </button>
            </div>
          </>
        ) : (
          <div className="jd-cap-empty">
            <MapPin size={22} />
            <div>Mag-type ng lugar sa itaas para makita ang mapa.</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
