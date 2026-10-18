/* UploadPanel — "Upload" tool mula sa ToolsMenu.
   Pumipili ng file/image at idinadagdag sa composer attachments
   (via jd:attach-files event — pinakikinggan ng Composer). */
import { useRef } from "react";
import { Paperclip, Image as ImageIcon, X } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { useToast } from "../../state/ToastContext.jsx";

export default function UploadPanel({ onClose }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const imageRef = useRef(null);

  const dispatch = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    window.dispatchEvent(new CustomEvent("jd:attach-files", { detail: { files } }));
    toast(files.length === 1 ? `Naka-attach: ${files[0].name}` : `${files.length} files naka-attach`);
    onClose?.();
  };

  return (
    <Modal open onClose={onClose} title="Upload sa chat">
      <div className="jd-cap-stack">
        <button
          type="button"
          className="jd-tool-row"
          onClick={() => fileRef.current?.click()}
        >
          <span className="jd-tool-row__icon"><Paperclip size={20} /></span>
          <span className="jd-tool-row__text">
            <span className="jd-tool-row__label">Mag-attach ng file</span>
            <span className="jd-tool-row__desc">Docs, code, text — max 8MB bawat isa</span>
          </span>
        </button>
        <button
          type="button"
          className="jd-tool-row"
          onClick={() => imageRef.current?.click()}
        >
          <span className="jd-tool-row__icon"><ImageIcon size={20} /></span>
          <span className="jd-tool-row__text">
            <span className="jd-tool-row__label">Mag-attach ng image</span>
            <span className="jd-tool-row__desc">Vision analysis kung kaya ng model</span>
          </span>
        </button>
        <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={onClose}>
          <X size={16} /> Isara
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          dispatch(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          dispatch(e.target.files);
          e.target.value = "";
        }}
      />
    </Modal>
  );
}
