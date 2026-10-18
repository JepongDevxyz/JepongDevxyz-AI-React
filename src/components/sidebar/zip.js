/* zip.js — minimal ZIP reader (stored + deflated), walang dependency.
   Sapat para sa ChatGPT/Claude/Gemini/Meta AI chat exports (.zip).
   Gumagamit ng DecompressionStream("deflate-raw") para sa method 8. */
const EOCD_SIG = 0x06054b50;
const CDH_SIG = 0x02014b50;
const LFH_SIG = 0x04034b50;

function findEocd(view) {
  // EOCD nasa huling 64KB + 22 bytes
  const start = Math.max(0, view.byteLength - 66000);
  for (let i = view.byteLength - 22; i >= start; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) return i;
  }
  return -1;
}

async function inflateRaw(data) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream is not supported in this browser");
  }
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([data]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/* ArrayBuffer → [{ name, data: Uint8Array }] */
export async function readZipEntries(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const eocd = findEocd(view);
  if (eocd < 0) throw new Error("Not a valid zip file (EOCD not found)");
  const cdCount = view.getUint16(eocd + 10, true);
  const cdOffset = view.getUint32(eocd + 16, true);

  const entries = [];
  let p = cdOffset;
  const td = new TextDecoder("utf-8");

  for (let i = 0; i < cdCount; i++) {
    if (view.getUint32(p, true) !== CDH_SIG) break;
    const method = view.getUint16(p + 10, true);
    const flags = view.getUint16(p + 8, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const lho = view.getUint32(p + 42, true);
    const nameBytes = new Uint8Array(arrayBuffer, p + 46, nameLen);
    const name = td.decode(nameBytes);
    p += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue; // directory
    if (flags & 0x08) continue; // data descriptor — hindi suportado, laktawan

    // Local file header → data offset
    if (view.getUint32(lho, true) !== LFH_SIG) continue;
    const lNameLen = view.getUint16(lho + 26, true);
    const lExtraLen = view.getUint16(lho + 28, true);
    const dataOff = lho + 30 + lNameLen + lExtraLen;
    const compData = new Uint8Array(arrayBuffer, dataOff, compSize);

    let data;
    if (method === 0) data = compData.slice();
    else if (method === 8) data = await inflateRaw(compData);
    else continue; // hindi suportadong compression

    entries.push({ name, data });
  }
  return entries;
}

export function entriesToText(entries) {
  const td = new TextDecoder("utf-8");
  return entries.map((e) => ({ name: e.name, text: td.decode(e.data) }));
}
