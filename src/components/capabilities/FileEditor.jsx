/* FileEditor — simpleng file editor sa virtual FS (localStorage).
   Filename + textarea; Save → VFS, Open mula sa listahan, Download bilang file,
   Delete. Entry mula sa ToolsMenu at mula sa chat attachments ("Edit" action —
   via openTool('editor', { open: 'chat/<name>' })). */
import { useEffect, useState } from "react";
import { Save, FolderOpen, Download, Trash2, FilePlus2, X } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import {
  listFiles,
  getFile,
  saveFile,
  deleteFile,
  downloadFile,
  sanitizeName,
} from "./vfs.js";

export default function FileEditor({ onClose, initialOpen }) {
  const { toast } = useToast();
  const [files, setFiles] = useState(() => listFiles());
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);

  const refresh = () => setFiles(listFiles());

  /* Bukas mula sa labas (hal. chat attachment "Edit") */
  useEffect(() => {
    if (initialOpen) {
      const f = getFile(initialOpen);
      if (f) {
        setName(f.name);
        setContent(f.content);
        setDirty(false);
      }
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openFile = (n) => {
    if (dirty && !window.confirm("May hindi naka-save na pagbabago. Ituloy?")) return;
    const f = getFile(n);
    if (!f) {
      toast("Hindi mahanap ang file");
      return;
    }
    setName(f.name);
    setContent(f.content);
    setDirty(false);
  };

  const save = () => {
    const n = sanitizeName(name);
    if (!n) {
      toast("Maglagay ng filename");
      return;
    }
    saveFile(n, content);
    setName(n);
    setDirty(false);
    refresh();
    toast(`Nai-save: ${n}`);
  };

  const newFile = () => {
    if (dirty && !window.confirm("May hindi naka-save na pagbabago. Ituloy?")) return;
    setName("");
    setContent("");
    setDirty(false);
  };

  const del = (n) => {
    if (!window.confirm(`Burahin ang "${n}"?`)) return;
    deleteFile(n);
    if (name === n) {
      setName("");
      setContent("");
      setDirty(false);
    }
    refresh();
    toast("Nabura ang file");
  };

  const dl = (n) => {
    if (downloadFile(n)) toast("Nada-download ang file");
    else toast("Hindi mahanap ang file");
  };

  const lineCount = content ? content.split("\n").length : 0;

  return (
    <Modal open onClose={onClose} title="File Editor" wide>
      <div className="jd-cap-stack">
        <div className="jd-cap-row">
          <input
            className="jd-cap-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            placeholder="filename.txt"
            maxLength={80}
            aria-label="Filename"
          />
          <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={newFile} title="Bagong file">
            <FilePlus2 size={15} /> Bago
          </button>
          <button type="button" className="jd-cap-btn" onClick={save} title="I-save sa device">
            <Save size={15} /> Save{dirty ? " *" : ""}
          </button>
        </div>

        <textarea
          className="jd-codearea jd-codearea--tall"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
          spellCheck={false}
          placeholder="Isulat ang laman ng file dito…"
          aria-label="File content"
          rows={12}
        />
        <div className="jd-cap-meta">
          {content.length.toLocaleString()} chars · {lineCount} lines
          {dirty ? " · may hindi naka-save" : ""}
        </div>

        <div className="jd-cap-subhead">
          <FolderOpen size={15} /> Naka-save sa device ({files.length})
        </div>
        <div className="jd-cap-list jd-cap-list--compact">
          {files.length === 0 ? (
            <div className="jd-cap-empty">Walang naka-save na file.</div>
          ) : (
            files.map((f) => (
              <div key={f.name} className={`jd-file-row${name === f.name ? " is-active" : ""}`}>
                <button
                  type="button"
                  className="jd-file-row__name"
                  onClick={() => openFile(f.name)}
                  title={f.name}
                >
                  {f.name}
                </button>
                <span className="jd-file-row__meta">
                  {f.content.length > 1024
                    ? `${(f.content.length / 1024).toFixed(1)}KB`
                    : `${f.content.length}B`}
                </span>
                <button
                  type="button"
                  className="jd-cap-iconbtn"
                  onClick={() => dl(f.name)}
                  aria-label={`I-download ang ${f.name}`}
                  title="I-download"
                >
                  <Download size={15} />
                </button>
                <button
                  type="button"
                  className="jd-cap-iconbtn jd-cap-iconbtn--danger"
                  onClick={() => del(f.name)}
                  aria-label={`Burahin ang ${f.name}`}
                  title="Burahin"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="jd-cap-row jd-cap-row--end">
          <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={onClose}>
            <X size={15} /> Isara
          </button>
        </div>
      </div>
    </Modal>
  );
}
