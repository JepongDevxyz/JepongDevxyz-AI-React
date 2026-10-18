/* LegalDetail — Terms / Privacy / Refund policy text. */
const DOCS = {
  terms: {
    title: "Terms of Service",
    body: `**1. Ang serbisyo**
JepongDevxyz AI ("ang App") ay AI assistant ni Jay-Ar Lee Espiritu. Sa paggamit ng App, sumasang-ayon ka sa mga tuntuning ito.

**2. Paggamit**
Gamitin ang App nang responsable. Bawal ang ilegal, mapanirang, o mapang-abusong paggamit, kabilang ang pag-bypass sa mga limitasyon ng credits o quota.

**3. Credits**
Ang credits ay para sa paggamit ng AI models. Ang bawat request ay may katumbas na credits batay sa model at haba ng sagot.

**4. "As is"**
Ibinibigay ang App nang "as is" — walang garantiya na laging tama o available ang mga sagot ng AI.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `**1. Anong kinokolekta namin**
Chats, settings, at account email (kapag naka-login). Hindi namin binebenta ang data mo.

**2. Saan naka-store**
Sa device mo (localStorage) at sa aming servers para sa chat history at credits. Ang API keys sa Credential Vault ay naka-encrypt (AES-GCM) at hindi nababasa ng server.

**3. Third parties**
Ang mga mensahe ay ipinapadala sa AI model providers para makabuo ng sagot. Tingnan ang kanilang privacy policies.

**4. Pagbura**
Puwede mong burahin ang lahat ng data sa device sa Settings → Account → Burahin ang account.

Makipag-ugnayan: businessdevgithubjepong@gmail.com`,
  },
  refund: {
    title: "Refund Policy",
    body: `**Mahalagang paalala**
Ang lahat ng credit top-up sa pamamagitan ng QRPh ay **strictly non-refundable**.

**1. Walang refund**
Kapag na-credit na ang top-up sa account, hindi na ito puwedeng i-refund o i-convert sa cash.

**2. Failed top-up**
Kung nabawasan ang bayad pero hindi pumasok ang credits, makipag-ugnayan sa businessdevgithubjepong@gmail.com kasama ang resibo — ive-verify at mano-manong ia-adjust.

**3. Guest credits**
Ang libreng guest credits (100/day) ay walang monetary value.`,
  },
};

function renderBody(body) {
  return String(body)
    .split("\n\n")
    .map((para, i) => {
      const html = para
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br/>");
      return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    });
}

export default function LegalDetail({ doc = "terms" }) {
  const d = DOCS[doc] || DOCS.terms;
  return (
    <div className="jd-detail">
      <div className="jd-card jd-legal">
        {renderBody(d.body)}
      </div>
    </div>
  );
}

export { DOCS };
