import { useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE === undefined ? "http://localhost:4000" : import.meta.env.VITE_API_BASE;

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function buildDraftFromValue(value) {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      return Object.fromEntries(Object.keys(value[0]).map((key) => [key, ""]));
    }
    return { value: "" };
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([key, itemValue]) => {
      if (Array.isArray(itemValue)) {
        return [key, itemValue.join(", ")];
      }
      return [key, String(itemValue ?? "")];
    });
    return Object.fromEntries(entries);
  }
  return { value: "" };
}

function parseDraftValue(raw) {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return trimmed;
}

function normalizeDraft(draft) {
  return Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, parseDraftValue(value)]));
}

function isSimpleArraySection(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem("adminKey") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [section, setSection] = useState("skills");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [editorText, setEditorText] = useState("{}");
  const [fullText, setFullText] = useState("{}");
  const [sectionDraft, setSectionDraft] = useState({});
  const [itemDraft, setItemDraft] = useState({});
  const [mode, setMode] = useState("simple");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sectionValue = useMemo(() => (portfolio ? portfolio[section] : undefined), [portfolio, section]);
  const isArraySection = Array.isArray(sectionValue);
  const isObjectSection = sectionValue && typeof sectionValue === "object" && !Array.isArray(sectionValue);
  const isStringArray = isSimpleArraySection(sectionValue);

  async function adminFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let responseMessage = "Erreur API";
      try {
        const payload = await response.json();
        responseMessage = payload.message || responseMessage;
      } catch {
        responseMessage = "Erreur API";
      }
      throw new Error(responseMessage);
    }

    if (response.status === 204) {
      return {};
    }
    return response.json();
  }

  function syncEditors(data, currentSection = section) {
    setPortfolio(data);
    setFullText(pretty(data));
    const value = data[currentSection];
    setSectionDraft(buildDraftFromValue(value));
    setItemDraft(buildDraftFromValue(value));
    if (Array.isArray(value)) {
      setSelectedIndex(-1);
      setEditorText("{}");
    } else {
      setSelectedIndex(-1);
      setEditorText(pretty(value));
    }
  }

  async function loadPortfolio() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/portfolio");
      localStorage.setItem("adminKey", adminKey);
      syncEditors(data);
      setIsAuthenticated(true);
      setMessage("Donnees chargees.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onSectionChange(nextSection) {
    setSection(nextSection);
    if (!portfolio) return;
    const value = portfolio[nextSection];
    setSectionDraft(buildDraftFromValue(value));
    setItemDraft(buildDraftFromValue(value));
    if (Array.isArray(value)) {
      setSelectedIndex(-1);
      setEditorText("{}");
    } else {
      setSelectedIndex(-1);
      setEditorText(pretty(value));
    }
  }

  async function updateObjectSection() {
    try {
      const parsed = mode === "simple" ? normalizeDraft(sectionDraft) : JSON.parse(editorText);
      await adminFetch(`/api/admin/section/${section}`, {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
      await loadPortfolio();
      setMessage(`Section ${section} mise a jour.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addArrayItem() {
    try {
      const parsed =
        mode === "simple"
          ? isStringArray
            ? String(itemDraft.value || "").trim()
            : normalizeDraft(itemDraft)
          : JSON.parse(editorText);
      await adminFetch(`/api/admin/section/${section}`, {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      await loadPortfolio();
      setEditorText("{}");
      setItemDraft(buildDraftFromValue(sectionValue));
      setMessage("Element ajoute.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateArrayItem() {
    if (selectedIndex < 0) {
      setError("Selectionne un element a modifier.");
      return;
    }
    try {
      const parsed =
        mode === "simple"
          ? isStringArray
            ? String(itemDraft.value || "").trim()
            : normalizeDraft(itemDraft)
          : JSON.parse(editorText);
      await adminFetch(`/api/admin/section/${section}/${selectedIndex}`, {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
      await loadPortfolio();
      setMessage("Element modifie.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteArrayItem(index) {
    if (!window.confirm("Supprimer cet element ?")) return;
    try {
      await adminFetch(`/api/admin/section/${section}/${index}`, {
        method: "DELETE",
      });
      await loadPortfolio();
      setEditorText("{}");
      setSelectedIndex(-1);
      setMessage("Element supprime.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveFullPortfolio() {
    try {
      const parsed = JSON.parse(fullText);
      await adminFetch("/api/admin/portfolio", {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
      await loadPortfolio();
      setMessage("Portfolio complet sauvegarde.");
    } catch (err) {
      setError(err.message);
    }
  }

  function renderFormFields(values, onChange) {
    return (
      <div className="admin-fields">
        {Object.entries(values).map(([key, value]) => (
          <label key={key} className="admin-field">
            <span>{key}</span>
            <input value={value} onChange={(event) => onChange(key, event.target.value)} />
          </label>
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-page">
        <section className="admin-card auth-card">
          <h1>Connexion Admin</h1>
          <p>Entre ta cle admin pour acceder au dashboard de gestion.</p>
          <label htmlFor="admin-key">Cle admin backend</label>
          <div className="admin-row">
            <input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Ex: admin123"
            />
            <button type="button" onClick={loadPortfolio} disabled={loading || !adminKey.trim()}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            <a href="/">Retour au portfolio</a>
          </div>
          {error ? <p className="admin-error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1>Dashboard Admin Portfolio</h1>
        <p>Ajoute, modifie et supprime les contenus du portfolio facilement.</p>
      </header>

      <section className="admin-card">
        <div className="admin-row">
          <button type="button" onClick={loadPortfolio} disabled={loading}>
            {loading ? "Actualisation..." : "Actualiser les donnees"}
          </button>
          <button type="button" onClick={() => setMode(mode === "simple" ? "advanced" : "simple")}>
            {mode === "simple" ? "Passer en mode JSON" : "Passer en mode formulaire"}
          </button>
          <a href="/">Retour au portfolio</a>
          <button
            type="button"
            onClick={() => {
              setIsAuthenticated(false);
              setPortfolio(null);
              setMessage("");
              setError("");
            }}
          >
            Se deconnecter
          </button>
        </div>
        {message ? <p className="admin-message">{message}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
      </section>

      {portfolio ? (
        <>
          <section className="admin-card">
            <h2>Edition par section</h2>
            <div className="admin-row">
              <select value={section} onChange={(event) => onSectionChange(event.target.value)}>
                {Object.keys(portfolio).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            {isArraySection ? (
              <div className="admin-grid">
                <div>
                  <h3>Elements ({sectionValue.length})</h3>
                  <div className="admin-list">
                    {sectionValue.map((item, index) => (
                      <article key={`${section}-${index}`} className="admin-list-item">
                        <pre>{pretty(item)}</pre>
                        <div className="admin-row">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIndex(index);
                              setEditorText(pretty(item));
                              if (mode === "simple") {
                                if (typeof item === "string") {
                                  setItemDraft({ value: item });
                                } else {
                                  const nextDraft = Object.fromEntries(
                                    Object.entries(item).map(([key, value]) => [
                                      key,
                                      Array.isArray(value) ? value.join(", ") : String(value ?? ""),
                                    ])
                                  );
                                  setItemDraft(nextDraft);
                                }
                              }
                            }}
                          >
                            Modifier
                          </button>
                          <button type="button" className="danger" onClick={() => deleteArrayItem(index)}>
                            Supprimer
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <h3>{selectedIndex >= 0 ? `Modifier #${selectedIndex}` : "Ajouter un element"}</h3>
                  {mode === "simple" ? (
                    isStringArray ? (
                      <label className="admin-field">
                        <span>Valeur</span>
                        <input
                          value={itemDraft.value || ""}
                          onChange={(event) => setItemDraft({ value: event.target.value })}
                        />
                      </label>
                    ) : (
                      renderFormFields(itemDraft, (key, value) =>
                        setItemDraft((current) => ({ ...current, [key]: value }))
                      )
                    )
                  ) : (
                    <textarea value={editorText} onChange={(event) => setEditorText(event.target.value)} rows={15} />
                  )}
                  <div className="admin-row">
                    <button type="button" onClick={addArrayItem}>
                      Ajouter
                    </button>
                    <button type="button" onClick={updateArrayItem}>
                      Enregistrer modification
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {isObjectSection ? (
              <>
                {mode === "simple" ? (
                  renderFormFields(sectionDraft, (key, value) =>
                    setSectionDraft((current) => ({ ...current, [key]: value }))
                  )
                ) : (
                  <textarea value={editorText} onChange={(event) => setEditorText(event.target.value)} rows={18} />
                )}
                <div className="admin-row">
                  <button type="button" onClick={updateObjectSection}>
                    Enregistrer section
                  </button>
                </div>
              </>
            ) : null}
          </section>

          <section className="admin-card">
            <h2>Edition complete JSON</h2>
            <textarea value={fullText} onChange={(event) => setFullText(event.target.value)} rows={20} />
            <div className="admin-row">
              <button type="button" onClick={saveFullPortfolio}>
                Sauvegarder tout le portfolio
              </button>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
