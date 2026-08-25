const searchDialog =
  document.getElementById("searchDialog");

const searchWizard =
  document.getElementById("searchWizard");

const wizardSteps = [
  ...document.querySelectorAll(".wizard-step")
];

const propertyChoices = [
  ...document.querySelectorAll(".property-choice")
];

const roomFilters =
  document.getElementById("roomFilters");

const progressBar =
  document.getElementById("progressBar");

const wizardTitle =
  document.getElementById("wizardTitle");

const previousButton =
  document.getElementById("previousButton");

const nextButton =
  document.getElementById("nextButton");

const closeDialog =
  document.getElementById("closeDialog");

const searchSummary =
  document.getElementById("searchSummary");

const betaForm =
  document.getElementById("betaForm");

const betaMessage =
  document.getElementById("betaMessage");

const scrollHint =
  document.getElementById("scrollHint");

const poiCategories = [
  ...document.querySelectorAll(".poi-category")
];

const poiResults =
  document.getElementById("poiResults");

const distanceBlock =
  document.getElementById("distanceBlock");

const savedSearches =
  document.getElementById("savedSearches");

const mySearches =
  document.getElementById("mySearches");

const newSearchFromDashboard =
  document.getElementById("newSearchFromDashboard");


let currentStep = 1;

let propertyType = "Stanza";

let selectedPoiCategory = "";

let searches =
  loadSearches();


const wizardTitles = [
  "Dove cerchi?",
  "Cosa cerchi?",
  "Budget e disponibilità",
  "Vuoi aggiungere altri filtri?",
  "Controlla la tua ricerca"
];


/* =========================
   POI DEMO
========================= */

const poiDatabase = {

  prato: {

    "Stazione": [
      "Stazione di Prato Centrale",
      "Stazione di Prato Porta al Serraglio",
      "Stazione di Prato Borgonuovo"
    ],

    "Università": [
      "PIN - Polo Universitario Città di Prato"
    ],

    "Ospedale": [
      "Ospedale Santo Stefano"
    ],

    "Centro commerciale": [
      "Parco Prato",
      "Centro Commerciale Prato Est"
    ],

    "Parco": [
      "Parco delle Cascine di Tavola",
      "Parco della Liberazione e della Pace"
    ],

    "Scuola": [
      "Centro scolastico Datini",
      "Istituto Gramsci-Keynes"
    ]

  },


  latina: {

    "Stazione": [
      "Stazione di Latina"
    ],

    "Università": [
      "Sapienza Università di Roma - Polo di Latina"
    ],

    "Ospedale": [
      "Ospedale Santa Maria Goretti"
    ],

    "Centro commerciale": [
      "Centro Commerciale Latinafiori",
      "Centro Commerciale Morbella"
    ],

    "Parco": [
      "Parco Falcone e Borsellino",
      "Parco San Marco"
    ],

    "Scuola": [
      "Liceo G.B. Grassi",
      "Istituto Vittorio Veneto Salvemini"
    ]

  },


  roma: {

    "Stazione": [
      "Roma Termini",
      "Roma Tiburtina",
      "Roma Ostiense"
    ],

    "Università": [
      "Sapienza Università di Roma",
      "Università Roma Tre",
      "Università Tor Vergata"
    ],

    "Ospedale": [
      "Policlinico Gemelli",
      "Policlinico Umberto I",
      "Ospedale San Camillo"
    ],

    "Centro commerciale": [
      "Porta di Roma",
      "Euroma2",
      "RomaEst"
    ],

    "Parco": [
      "Villa Borghese",
      "Villa Doria Pamphilj",
      "Parco degli Acquedotti"
    ],

    "Scuola": [
      "Zona scuole Roma centro"
    ]

  }

};


/* =========================
   APERTURA WIZARD
========================= */

function openSearchWizard() {

  currentStep = 1;

  updateWizard();

  searchDialog.showModal();

}


[
  "headerStart",
  "heroStart",
  "phoneSearchButton"
].forEach(id => {

  const button =
    document.getElementById(id);

  if (button) {

    button.addEventListener(
      "click",
      openSearchWizard
    );

  }

});


if (newSearchFromDashboard) {

  newSearchFromDashboard.addEventListener(
    "click",
    openSearchWizard
  );

}


/* =========================
   SCROLL HOME
========================= */

function scrollToHowItWorks() {

  const section =
    document.getElementById("howItWorks");

  if (section) {

    section.scrollIntoView({
      behavior: "smooth"
    });

  }

}


const discoverButton =
  document.getElementById("discoverButton");

if (discoverButton) {

  discoverButton.addEventListener(
    "click",
    scrollToHowItWorks
  );

}


if (scrollHint) {

  scrollHint.addEventListener(
    "click",
    scrollToHowItWorks
  );

}


/* =========================
   CHIUSURA MODALE
========================= */

if (closeDialog) {

  closeDialog.addEventListener(
    "click",
    () => {

      searchDialog.close();

    }
  );

}


/* =========================
   TIPO IMMOBILE
========================= */

propertyChoices.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      propertyChoices.forEach(
        choice => {

          choice.classList.remove(
            "active"
          );

        }
      );

      button.classList.add(
        "active"
      );

      propertyType =
        button.dataset.type;

      updateDynamicFilters();

    }
  );

});


function updateDynamicFilters() {

  if (!roomFilters) {
    return;
  }

  if (propertyType === "Stanza") {

    roomFilters.style.display =
      "block";

  } else {

    roomFilters.style.display =
      "none";

  }

}


/* =========================
   POI
========================= */

poiCategories.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const city =
        searchWizard.elements
          .searchCity
          .value
          .trim();

      if (!city) {

        alert(
          "Inserisci prima la città."
        );

        searchWizard.elements
          .searchCity
          .focus();

        return;

      }

      poiCategories.forEach(
        category => {

          category.classList.remove(
            "active"
          );

        }
      );

      button.classList.add(
        "active"
      );

      selectedPoiCategory =
        button.dataset.poiCategory;

      populatePoiOptions();

    }
  );

});


function populatePoiOptions() {

  const city =
    normalizeCity(
      searchWizard.elements
        .searchCity
        .value
    );

  const poiSelect =
    searchWizard.elements.poi;

  poiSelect.innerHTML =
    '<option value="">Seleziona</option>';

  let options = [];

  if (
    poiDatabase[city] &&
    poiDatabase[city][selectedPoiCategory]
  ) {

    options =
      poiDatabase[city][
        selectedPoiCategory
      ];

  } else {

  options = [];

}

  options.forEach(name => {

    const option =
      document.createElement(
        "option"
      );

    option.value = name;

    option.textContent = name;

    poiSelect.appendChild(
      option
    );

  });
if (options.length === 0) {

  const option =
    document.createElement(
      "option"
    );

  option.value = "";

  option.textContent =
    "Nessun suggerimento disponibile nella demo";

  poiSelect.appendChild(
    option
  );

}
 poiResults.hidden = false;

distanceBlock.hidden = true;

setTimeout(() => {
  poiResults.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}, 100);

}


searchWizard.elements.poi
  .addEventListener(
    "change",
    event => {

      distanceBlock.hidden =
        !event.target.value;

      if (event.target.value) {

        setTimeout(() => {
          distanceBlock.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
          });
        }, 100);

      }

    }
  );


searchWizard.elements.searchCity
  .addEventListener(
    "input",
    () => {

      resetPoiSelection();

    }
  );


function resetPoiSelection() {

  selectedPoiCategory = "";

  poiCategories.forEach(
    category => {

      category.classList.remove(
        "active"
      );

    }
  );

  poiResults.hidden = true;

  distanceBlock.hidden = true;

  searchWizard.elements.poi
    .innerHTML =
      '<option value="">Seleziona</option>';

}


/* =========================
   NAVIGAZIONE WIZARD
========================= */

previousButton.addEventListener(
  "click",
  () => {

    if (currentStep > 1) {

      currentStep--;

      updateWizard();

    }

  }
);


nextButton.addEventListener(
  "click",
  () => {

    if (!validateCurrentStep()) {

      return;

    }

    if (currentStep < 5) {

      currentStep++;

      if (currentStep === 5) {

        buildSearchSummary();

      }

      updateWizard();

    } else {

      activateSearch();

    }

  }
);


/* =========================
   AGGIORNA WIZARD
========================= */

function updateWizard() {

  wizardSteps.forEach(step => {

    const stepNumber =
      Number(
        step.dataset.step
      );

    step.classList.toggle(
      "active",
      stepNumber === currentStep
    );

  });


  wizardTitle.textContent =
    wizardTitles[
      currentStep - 1
    ];


  progressBar.style.width =
    `${currentStep * 20}%`;


  previousButton.disabled =
    currentStep === 1;


  if (currentStep === 5) {

    nextButton.textContent =
      "Attiva ricerca";

  } else {

    nextButton.textContent =
      "Continua";

  }


  const wizardContent =
    document.querySelector(
      ".wizard-content"
    );

  if (wizardContent) {

    wizardContent.scrollTop = 0;

  }

}


/* =========================
   VALIDAZIONE
========================= */

function validateCurrentStep() {

  if (currentStep === 1) {

    const city =
      searchWizard.elements
        .searchCity
        .value
        .trim();

    if (!city) {

      alert(
        "Inserisci la città in cui stai cercando."
      );

      searchWizard.elements
        .searchCity
        .focus();

      return false;

    }

  }


  if (currentStep === 3) {

    const budget =
      searchWizard.elements
        .budget
        .value;

    if (
      budget &&
      Number(budget) <= 0
    ) {

      alert(
        "Inserisci un budget valido."
      );

      return false;

    }

  }


  return true;

}


/* =========================
   RIEPILOGO
========================= */

function buildSearchSummary() {

  const data =
    collectFormData();

  const lines = [];


  lines.push(`

    <div>

      <strong>
        ${escapeHtml(data.propertyType)}
        a
        ${escapeHtml(data.city)}
      </strong>

    </div>

  `);


  if (data.addressZone) {

    lines.push(`

      <div>
        📍 Zona o indirizzo:
        <strong>
          ${escapeHtml(
            data.addressZone
          )}
        </strong>
      </div>

    `);

  }


  if (data.poi) {

    lines.push(`

      <div>
        📍 Punto di interesse:
        <strong>
          ${escapeHtml(data.poi)}
        </strong>
      </div>

      <div>
        Entro
        <strong>
          ${escapeHtml(
            data.distance
          )} km
        </strong>
      </div>

    `);

  }


  if (data.budget) {

    lines.push(`

      <div>
        💶 Budget massimo:
        <strong>
          €${escapeHtml(
            data.budget
          )}/mese
        </strong>
      </div>

    `);

  }


  if (data.availableFrom) {

    lines.push(`

      <div>
        📅 Disponibile da:
        <strong>
          ${formatDate(
            data.availableFrom
          )}
        </strong>
      </div>

    `);

  }


  if (data.duration) {

    lines.push(`

      <div>
        ⏳ Durata:
        <strong>
          ${escapeHtml(
            data.duration
          )}
        </strong>
      </div>

    `);

  }


  const generalPreferences = [];

  if (data.petFriendly) {
    generalPreferences.push(
      "animali ammessi"
    );
  }

  if (data.furnished) {
    generalPreferences.push(
      "arredato"
    );
  }


  if (generalPreferences.length) {

    lines.push(`

      <div>
        🏡 Preferenze:
        <strong>
          ${generalPreferences
            .map(escapeHtml)
            .join(", ")
          }
        </strong>
      </div>

    `);

  }


  const roomPreferences = [];

  if (
    data.propertyType === "Stanza"
  ) {

    if (data.womenOnly) {
      roomPreferences.push(
        "solo donne"
      );
    }

    if (data.menOnly) {
      roomPreferences.push(
        "solo uomini"
      );
    }

    if (data.mixed) {
      roomPreferences.push(
        "coinquilini misti"
      );
    }

    if (data.privateBathroom) {
      roomPreferences.push(
        "bagno privato"
      );
    }

    if (data.couplesAllowed) {
      roomPreferences.push(
        "coppie ammesse"
      );
    }

  }


  if (roomPreferences.length) {

    lines.push(`

      <div>
        🛏 Preferenze stanza:
        <strong>
          ${roomPreferences
            .map(escapeHtml)
            .join(", ")
          }
        </strong>
      </div>

    `);

  }


  const advanced =
    getAdvancedPreferences(
      data
    );


  if (advanced.length) {

    lines.push(`

      <div>
        ⚙️ Altri filtri:
        <strong>
          ${advanced
            .map(escapeHtml)
            .join(", ")
          }
        </strong>
      </div>

    `);

  }


  if (data.contractType) {

    lines.push(`

      <div>
        📄 Contratto:
        <strong>
          ${escapeHtml(
            data.contractType
          )}
        </strong>
      </div>

    `);

  }


  searchSummary.innerHTML =
    lines.join("");

}


/* =========================
   RACCOLTA DATI
========================= */

function collectFormData() {

  const elements =
    searchWizard.elements;


  return {

    city:
      elements.searchCity
        .value
        .trim(),

    addressZone:
      elements.addressZone
        .value
        .trim(),

    poi:
      elements.poi
        .value,

    poiCategory:
      selectedPoiCategory,

    distance:
      elements.distance
        .value,

    propertyType,

    budget:
      elements.budget
        .value,

    availableFrom:
      elements.availableFrom
        .value,

    duration:
      elements.duration
        .value,

    petFriendly:
      elements.petFriendly
        .checked,

    furnished:
      elements.furnished
        .checked,

    womenOnly:
      propertyType === "Stanza"
        ? elements.womenOnly
            .checked
        : false,

    menOnly:
      propertyType === "Stanza"
        ? elements.menOnly
            .checked
        : false,

    mixed:
      propertyType === "Stanza"
        ? elements.mixed
            .checked
        : false,

    privateBathroom:
      propertyType === "Stanza"
        ? elements.privateBathroom
            .checked
        : false,

    couplesAllowed:
      propertyType === "Stanza"
        ? elements.couplesAllowed
            .checked
        : false,

    utilitiesIncluded:
      elements.utilitiesIncluded
        .checked,

    privateOnly:
      elements.privateOnly
        .checked,

    noAgencyFees:
      elements.noAgencyFees
        .checked,

    balcony:
      elements.balcony
        .checked,

    elevator:
      elements.elevator
        .checked,

    parking:
      elements.parking
        .checked,

    airConditioning:
      elements.airConditioning
        .checked,

    washingMachine:
      elements.washingMachine
        .checked,

    dishwasher:
      elements.dishwasher
        .checked,

    wifiIncluded:
      elements.wifiIncluded
        .checked,

    noGroundFloor:
      elements.noGroundFloor
        .checked,

    noBasement:
      elements.noBasement
        .checked,

    contractType:
      elements.contractType
        .value

  };

}


/* =========================
   FILTRI AVANZATI
========================= */

function getAdvancedPreferences(
  data
) {

  const preferences = [];

  const mapping = [
    [
      "utilitiesIncluded",
      "utenze incluse"
    ],
    [
      "privateOnly",
      "solo privati"
    ],
    [
      "noAgencyFees",
      "no commissioni agenzia"
    ],
    [
      "balcony",
      "balcone/terrazzo"
    ],
    [
      "elevator",
      "ascensore"
    ],
    [
      "parking",
      "posto auto/garage"
    ],
    [
      "airConditioning",
      "aria condizionata"
    ],
    [
      "washingMachine",
      "lavatrice"
    ],
    [
      "dishwasher",
      "lavastoviglie"
    ],
    [
      "wifiIncluded",
      "Wi-Fi incluso"
    ],
    [
      "noGroundFloor",
      "no piano terra"
    ],
    [
      "noBasement",
      "no seminterrato"
    ]
  ];


  mapping.forEach(
    ([key, label]) => {

      if (data[key]) {

        preferences.push(
          label
        );

      }

    }
  );


  return preferences;

}


/* =========================
   ATTIVA RICERCA
========================= */

function activateSearch() {

  const formData =
    collectFormData();


  const searchData = {

    id:
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),

    ...formData,

    status:
      "active",

    createdAt:
      new Date().toISOString()

  };


  searches.unshift(
    searchData
  );


  saveSearches();

  renderSearches();


  searchDialog.close();


  mySearches.hidden = false;


  mySearches.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });


  resetWizardForm();

}


/* =========================
   SALVATAGGIO LOCALE
========================= */

function loadSearches() {

  try {

    const stored =
      localStorage.getItem(
        "affitti-smart-searches"
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {

    return [];

  }

}


function saveSearches() {

  localStorage.setItem(
    "affitti-smart-searches",
    JSON.stringify(searches)
  );

}


/* =========================
   RENDER LE MIE RICERCHE
========================= */

function renderSearches() {

  if (!savedSearches) {
    return;
  }


  if (!searches.length) {

    savedSearches.innerHTML = "";

    mySearches.hidden = true;

    return;

  }


  mySearches.hidden = false;


  savedSearches.innerHTML =
    searches
      .map(
        search =>
          buildSavedSearchCard(
            search
          )
      )
      .join("");


  bindSearchCardActions();

}


function buildSavedSearchCard(
  search
) {

  const location = [];

  if (search.addressZone) {
    location.push(
      search.addressZone
    );
  }

  if (search.poi) {
    location.push(
      search.poi
    );
  }


  const statusLabel =
    search.status === "paused"
      ? "In pausa"
      : "Ricerca attiva";


  let details = "";


  if (location.length) {

    details += `

      <p>
        📍
        ${escapeHtml(
          location.join(" · ")
        )}
      </p>

    `;

  }


  if (search.poi) {

    details += `

      <p>
        Entro
        ${escapeHtml(
          search.distance
        )} km
      </p>

    `;

  }


  if (search.budget) {

    details += `

      <p>
        💶 Max
        €${escapeHtml(
          search.budget
        )}/mese
      </p>

    `;

  }


  if (search.availableFrom) {

    details += `

      <p>
        📅 Dal
        ${formatDate(
          search.availableFrom
        )}
      </p>

    `;

  }


  if (search.petFriendly) {

    details += `

      <p>
        🐾 Animali ammessi
      </p>

    `;

  }


  return `

    <article
      class="saved-search-card"
      data-search-id="${
        escapeHtml(search.id)
      }"
    >

      <div class="saved-search-top">

        <div>

          <h3>
            ${escapeHtml(
              search.propertyType
            )}
            a
            ${escapeHtml(
              search.city
            )}
          </h3>

          ${details}

        </div>


        <span class="search-active">
          ${
            search.status === "paused"
              ? "⏸"
              : "●"
          }
          ${statusLabel}
        </span>

      </div>


      <div class="saved-search-actions">

        <button
          class="secondary toggle-search"
          type="button"
        >
          ${
            search.status === "paused"
              ? "Riattiva"
              : "Metti in pausa"
          }
        </button>


        <button
          class="secondary delete-search"
          type="button"
        >
          Elimina
        </button>

      </div>

    </article>

  `;

}


/* =========================
   AZIONI RICERCHE
========================= */

function bindSearchCardActions() {

  document
    .querySelectorAll(
      ".saved-search-card"
    )
    .forEach(card => {

      const id =
        card.dataset.searchId;


      const toggleButton =
        card.querySelector(
          ".toggle-search"
        );


      const deleteButton =
        card.querySelector(
          ".delete-search"
        );


      if (toggleButton) {

        toggleButton.addEventListener(
          "click",
          () => {

            toggleSearchStatus(id);

          }
        );

      }


      if (deleteButton) {

        deleteButton.addEventListener(
          "click",
          () => {

            deleteSearch(id);

          }
        );

      }

    });

}


function toggleSearchStatus(id) {

  searches =
    searches.map(search => {

      if (search.id !== id) {
        return search;
      }

      return {

        ...search,

        status:
          search.status === "paused"
            ? "active"
            : "paused"

      };

    });


  saveSearches();

  renderSearches();

}


function deleteSearch(id) {

  const confirmed =
    confirm(
      "Vuoi eliminare questa ricerca?"
    );

  if (!confirmed) {
    return;
  }


  searches =
    searches.filter(
      search =>
        search.id !== id
    );


  saveSearches();

  renderSearches();

}


/* =========================
   RESET WIZARD
========================= */

function resetWizardForm() {

  searchWizard.reset();

  currentStep = 1;

  propertyType = "Stanza";

  selectedPoiCategory = "";

  propertyChoices.forEach(
    choice => {

      choice.classList.toggle(
        "active",
        choice.dataset.type === "Stanza"
      );

    }
  );


  resetPoiSelection();

  updateDynamicFilters();

  updateWizard();

}


/* =========================
   DATE
========================= */

function formatDate(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const date =
    new Date(
      `${dateString}T12:00:00`
    );


  return date.toLocaleDateString(
    "it-IT",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


/* =========================
   UTILITY
========================= */

function normalizeCity(
  value = ""
) {

  return value
    .trim()
    .toLowerCase();

}


function capitalize(
  value = ""
) {

  if (!value) {
    return "";
  }

  return (
    value.charAt(0)
      .toUpperCase() +
    value.slice(1)
  );

}


function escapeHtml(
  value = ""
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================
   BETA FORM
========================= */

if (betaForm) {

  betaForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const formData =
        new FormData(
          betaForm
        );


      const betaData = {

        name:
          formData.get("name"),

        email:
          formData.get("email"),

        city:
          formData.get("city"),

        type:
          formData.get("type"),

        createdAt:
          new Date()
            .toISOString()

      };


      localStorage.setItem(
        "affitti-smart-beta-demo",
        JSON.stringify(
          betaData
        )
      );


      betaMessage.textContent =
        "✓ Registrazione demo completata. " +
        "Il modulo reale verrà collegato " +
        "al database nella fase successiva.";


      betaMessage.style.color =
        "#0d6b5f";


      betaMessage.style.fontWeight =
        "800";

    }
  );

}


/* =========================
   CLICK FUORI DAL DIALOG
========================= */

searchDialog.addEventListener(
  "click",
  event => {

    const rect =
      searchDialog
        .getBoundingClientRect();


    const clickedOutside =

      event.clientX <
        rect.left ||

      event.clientX >
        rect.right ||

      event.clientY <
        rect.top ||

      event.clientY >
        rect.bottom;


    if (clickedOutside) {

      searchDialog.close();

    }

  }
);


/* =========================
   INIZIALIZZAZIONE
========================= */

updateDynamicFilters();

updateWizard();

renderSearches();
