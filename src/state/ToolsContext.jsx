/* ToolsContext — Phase 5 capabilities: Tools menu + 9 tool panels.
   useTools(): { menuOpen, openMenu, closeMenu, activeTool, openTool(id, args),
   closeTool }. Ang <CapabilitiesRoot/> ay naka-mount sa loob ng provider at
   nagre-render ng menu/panels bilang overlays (unmount pag sarado). */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import "../components/capabilities/capabilities.css";
import { ToolsMenuSheet } from "../components/capabilities/ToolsMenu.jsx";
import TodosPanel from "../components/capabilities/TodosPanel.jsx";
import JsRunner from "../components/capabilities/JsRunner.jsx";
import FileEditor from "../components/capabilities/FileEditor.jsx";
import DeepResearch from "../components/capabilities/DeepResearch.jsx";
import ExportDialog from "../components/capabilities/ExportDialog.jsx";
import ImageGen from "../components/capabilities/ImageGen.jsx";
import MapsPanel from "../components/capabilities/MapsPanel.jsx";
import WebSearch from "../components/capabilities/WebSearch.jsx";
import UploadPanel from "../components/capabilities/UploadPanel.jsx";

const ToolsContext = createContext(null);

function CapabilitiesRoot() {
  const { menuOpen, closeMenu, activeTool, closeTool, openTool } = useTools();
  const args = activeTool?.args || {};
  return (
    <>
      {menuOpen ? (
        <ToolsMenuSheet
          onClose={closeMenu}
          onPick={(id, pickArgs) => {
            closeMenu();
            // kaunting delay para hindi magsabay ang dalawang overlay animations
            setTimeout(() => openTool(id, pickArgs), 60);
          }}
        />
      ) : null}
      {activeTool?.id === "todos" ? <TodosPanel onClose={closeTool} /> : null}
      {activeTool?.id === "js" ? <JsRunner onClose={closeTool} /> : null}
      {activeTool?.id === "editor" ? <FileEditor onClose={closeTool} initialOpen={args.open} /> : null}
      {activeTool?.id === "research" ? <DeepResearch onClose={closeTool} /> : null}
      {activeTool?.id === "export" ? <ExportDialog onClose={closeTool} /> : null}
      {activeTool?.id === "imagine" ? <ImageGen onClose={closeTool} /> : null}
      {activeTool?.id === "maps" ? <MapsPanel onClose={closeTool} /> : null}
      {activeTool?.id === "websearch" ? <WebSearch onClose={closeTool} /> : null}
      {activeTool?.id === "upload" ? <UploadPanel onClose={closeTool} /> : null}
    </>
  );
}

export function ToolsProvider({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // {id, args}

  const openMenu = useCallback(() => {
    setActiveTool(null);
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openTool = useCallback((id, args) => {
    setMenuOpen(false);
    setActiveTool(id ? { id, args: args || {} } : null);
  }, []);
  const closeTool = useCallback(() => setActiveTool(null), []);

  const value = useMemo(
    () => ({ menuOpen, openMenu, closeMenu, activeTool, openTool, closeTool }),
    [menuOpen, openMenu, closeMenu, activeTool, openTool, closeTool]
  );

  return (
    <ToolsContext.Provider value={value}>
      {children}
      <CapabilitiesRoot />
    </ToolsContext.Provider>
  );
}

export function useTools() {
  const ctx = useContext(ToolsContext);
  if (!ctx) throw new Error("useTools must be used within <ToolsProvider>");
  return ctx;
}
