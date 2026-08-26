const STORAGE_KEY = "affitti-smart-searches-v2";

const dialog = document.getElementById("searchDialog");
const wizard = document.getElementById("searchWizard");
const steps = [...document.querySelectorAll(".wizard-step")];
const progressBar = document.getElementById("progressBar");
const stepLabel = document.getElementById("stepLabel");
const wizardTitle = document.getElementById("wizardTitle");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const closeDialogButton = document.getElementById("closeDialog");
const roomOptions = document.getElementById("roomOptions");
const proxyHouseholdOptions = document.getElementById("proxyHouseholdOptions");
const summary = document.getElementById("searchSummary");
const savedArea = document.getElementById("savedArea");
const savedGrid = document.getElementById("savedGrid");
const toast = document.getElementById("toast");

let currentStep = 1;
let searches = loadSearches();

const stepTitles = [
  "Chi abiterà nella nuova casa?",
  "Che tipo di casa può andare bene?",
  "Dove deve essere comoda?",
  "Quali esigenze deve rispettare?",
  "La casa che stai cercando"
];

function openWizard() {
  resetWizard();
  dialog.showModal();
}

["heroStart", "bottomStart", "newSearchButton"].forEach(id => {
  const element = document.getElementById(id);
  if (element) element.addEventListener("click", openWizard);
});

const loginButton = document.getElementById("loginButton");
if (loginButton) {
  loginButton.addEventListener("click", () => {
    showToast("L’accesso con account arriverà nella prossima fase della beta.");
  });
}

closeDialogButton.addEventListener("click", () => dialog.close());

wizard.addEventListener("input", updateNextButtonState);
wizard.addEventListener("change", updateNextButtonState);

dialog.addEventListener("click", event => {
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) dialog.close();
});

[...document.querySelectorAll(".single-choice")].forEach(group => {
  group.addEventListener("click", event => {
    const button = event.target.closest("[data-value]");
    if (!button || !group.contains(button)) return;
    group.querySelectorAll(":scope > [data-value], :scope > .choice-grid > [data-value]").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");

    if (group.dataset.group === "household") updateProxyHouseholdOptions();
    updateNextButtonState();
  });
});

[...document.querySelectorAll(".multi-choice")].forEach(group => {
  group.addEventListener("click", event => {
    const button = event.target.closest("[data-value]");
    if (!button) return;
    button.classList.toggle("selected");
    if (group.dataset.group === "types") updateRoomOptions();
    updateNextButtonState();
  });
});

function updateRoomOptions() {
  const selectedTypes = getSelected("types");
  const hasRoom = selectedTypes.includes("Stanza");
  roomOptions.hidden = !hasRoom;

  if (!hasRoom) {
    const roomGroup = document.querySelector('[data-group="roomPreferences"]');
    if (roomGroup) roomGroup.querySelectorAll(".selected").forEach(item => item.classList.remove("selected"));
  }
}

function updateProxyHouseholdOptions() {
  const searchingForSomeoneElse = getSelectedOne("household") === "Cerco per un'altra persona";
  proxyHouseholdOptions.hidden = !searchingForSomeoneElse;

  if (!searchingForSomeoneElse) {
    const proxyGroup = document.querySelector('[data-group="proxyHousehold"]');
    if (proxyGroup) proxyGroup.querySelectorAll(".selected").forEach(item => item.classList.remove("selected"));
  }
}

function updateNextButtonState() {
  let enabled = true;

  if (currentStep === 1) {
    const household = getSelectedOne("household");
    enabled = Boolean(household);
    if (household === "Cerco per un'altra persona") enabled = Boolean(getSelectedOne("proxyHousehold"));
  } else if (currentStep === 2) {
    enabled = getSelected("types").length > 0;
  } else if (currentStep === 3) {
    enabled = Boolean(wizard.elements.city.value.trim());
  }

  nextButton.disabled = !enabled;
}

previousButton.addEventListener("click", () => {
  if (currentStep === 1) return;
  currentStep -= 1;
  updateWizard();
});

nextButton.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;

  if (currentStep < steps.length) {
    currentStep += 1;
    if (currentStep === 5) buildSummary();
    updateWizard();
    return;
  }

  saveCurrentSearch();
});

function updateWizard() {
  steps.forEach((step, index) => step.classList.toggle("active", index + 1 === currentStep));
  progressBar.style.width = `${currentStep * 20}%`;
  stepLabel.textContent = `PASSO ${currentStep} DI 5`;
  wizardTitle.textContent = stepTitles[currentStep - 1];
  previousButton.disabled = currentStep === 1;
  nextButton.textContent = currentStep === 5 ? "Crea la ricerca" : "Continua";
  updateNextButtonState();
  document.querySelector(".wizard-body").scrollTop = 0;
}

function validateStep(step) {
  if (step === 1) {
    const household = getSelectedOne("household");
    if (!household) {
      showToast("Scegli chi abiterà nella nuova casa.");
      return false;
    }
    if (household === "Cerco per un'altra persona" && !getSelectedOne("proxyHousehold")) {
      showToast("Indica chi abiterà nella casa.");
      return false;
    }
  }

  if (step === 2 && getSelected("types").length === 0) {
    showToast("Scegli almeno un tipo di casa.");
    return false;
  }

  if (step === 3) {
    const city = wizard.elements.city.value.trim();
    if (!city) {
      showToast("Inserisci la città in cui stai cercando.");
      wizard.elements.city.focus();
      return false;
    }
  }

  if (step === 4) {
    const budget = wizard.elements.budget.value;
    if (budget && Number(budget) <= 0) {
      showToast("Inserisci un budget valido.");
      wizard.elements.budget.focus();
      return false;
    }
  }

  return true;
}

function getSelected(groupName) {
  const group = document.querySelector(`[data-group="${groupName}"]`);
  if (!group) return [];
  return [...group.querySelectorAll(".selected")].map(item => item.dataset.value);
}

function getSelectedOne(groupName) {
  return getSelected(groupName)[0] || "";
}

function collectData() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    household: getSelectedOne("household"),
    proxyHousehold: getSelectedOne("proxyHousehold"),
    types: getSelected("types"),
    roomPreferences: getSelected("roomPreferences"),
    city: wizard.elements.city.value.trim(),
    importantPlace: wizard.elements.importantPlace.value.trim(),
    travelMode: wizard.elements.travelMode.value,
    maxTravel: wizard.elements.maxTravel.value,
    budget: wizard.elements.budget.value,
    availableFrom: wizard.elements.availableFrom.value,
    mustHave: getSelected("mustHave"),
    notes: wizard.elements.notes.value.trim()
  };
}

function buildSummary() {
  const data = collectData();
  const rows = [
    ["Per chi", data.household === "Cerco per un'altra persona" && data.proxyHousehold ? `Un’altra persona · ${data.proxyHousehold}` : data.household],
    ["Tipo", data.types.join(" · ")],
    ["Dove", [data.city, data.importantPlace].filter(Boolean).join(" · ")],
    ["Spostamenti", [data.travelMode, data.maxTravel].filter(Boolean).join(" · ") || "Nessun limite indicato"],
    ["Budget", data.budget ? `Fino a €${escapeHtml(data.budget)}/mese` : "Da definire"],
    ["Indispensabili", [...data.roomPreferences, ...data.mustHave].join(" · ") || "Nessuno indicato"]
  ];

  if (data.notes) rows.push(["Note", data.notes]);

  summary.innerHTML = rows.map(([label, value]) => `
    <div class="summary-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");
}

function saveCurrentSearch() {
  const data = collectData();
  searches.unshift(data);
  persistSearches();
  renderSavedSearches();
  dialog.close();
  savedArea.hidden = false;
  savedArea.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Ricerca creata. Ora puoi iniziare ad aggiungere le case che trovi.");
}

function loadSearches() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(current) && current.length) return current.map(normalizeSearch);

    const legacy = JSON.parse(localStorage.getItem("affitti-smart-searches") || "[]");
    if (!Array.isArray(legacy) || !legacy.length) return [];

    const migrated = legacy.map(normalizeSearch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

function normalizeSearch(search) {
  const typeValue = search.types || search.propertyTypes || search.propertyType || [];
  const types = Array.isArray(typeValue) ? typeValue : [typeValue].filter(Boolean);

  return {
    id: search.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: search.createdAt || new Date().toISOString(),
    household: search.household || "Da definire",
    proxyHousehold: search.proxyHousehold || "",
    types: types.length ? types : ["Casa"],
    roomPreferences: Array.isArray(search.roomPreferences) ? search.roomPreferences : [],
    city: search.city || search.searchCity || "",
    importantPlace: search.importantPlace || search.addressZone || search.poi || "",
    travelMode: search.travelMode || "",
    maxTravel: search.maxTravel || (search.distance ? `Entro ${search.distance} km` : ""),
    budget: search.budget || "",
    availableFrom: search.availableFrom || search.available || "",
    mustHave: Array.isArray(search.mustHave) ? search.mustHave : [],
    notes: search.notes || ""
  };
}

function persistSearches() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

function renderSavedSearches() {
  if (!searches.length) {
    savedArea.hidden = true;
    savedGrid.innerHTML = "";
    return;
  }

  savedArea.hidden = false;
  savedGrid.innerHTML = searches.map(search => {
    const title = `${search.types.join(" / ")} · ${search.city}`;
    const chips = [
      search.budget ? `Max €${search.budget}` : "",
      ...search.roomPreferences.slice(0, 2),
      ...search.mustHave.slice(0, 2)
    ].filter(Boolean);

    return `
      <article class="saved-search" data-search-id="${escapeHtml(search.id)}">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(search.importantPlace || "Nessun luogo prioritario indicato")}</p>
        <div class="saved-chips">${chips.map(chip => `<span>${escapeHtml(chip)}</span>`).join("")}</div>
        <div class="saved-actions">
          <button class="secondary-button open-search" type="button">Apri ricerca</button>
          <button class="delete-button" type="button">Elimina</button>
        </div>
      </article>
    `;
  }).join("");
}

savedGrid.addEventListener("click", event => {
  const card = event.target.closest("[data-search-id]");
  if (!card) return;
  const id = card.dataset.searchId;

  if (event.target.closest(".delete-button")) {
    searches = searches.filter(search => search.id !== id);
    persistSearches();
    renderSavedSearches();
    showToast("Ricerca eliminata.");
    return;
  }

  if (event.target.closest(".open-search")) {
    showToast("La schermata operativa della ricerca è il prossimo modulo che realizzeremo.");
  }
});

function resetWizard() {
  currentStep = 1;
  wizard.reset();
  wizard.querySelectorAll(".selected").forEach(item => item.classList.remove("selected"));
  roomOptions.hidden = true;
  proxyHouseholdOptions.hidden = true;
  summary.innerHTML = "";
  updateWizard();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderSavedSearches();
