const searchDialog = document.getElementById("searchDialog");
const searchWizard = document.getElementById("searchWizard");

const wizardSteps = [
  ...document.querySelectorAll(".wizard-step")
];

const propertyChoices = [
  ...document.querySelectorAll(".property-choice")
];

const roomFilters = document.getElementById("roomFilters");

const progressBar = document.getElementById("progressBar");

const wizardTitle = document.getElementById("wizardTitle");

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


let currentStep = 1;
let propertyType = "Stanza";


const wizardTitles = [
  "Dove cerchi?",
  "Cosa cerchi?",
  "Budget e disponibilità",
  "Vuoi aggiungere altri filtri?",
  "Controlla la tua ricerca"
];


/* -------------------------
   APERTURA RICERCA
------------------------- */

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


/* -------------------------
   SCOPRI COME FUNZIONA
------------------------- */

const discoverButton =
  document.getElementById(
    "discoverButton"
  );

if (discoverButton) {

  discoverButton.addEventListener(
    "click",
    () => {

      document
        .getElementById("howItWorks")
        .scrollIntoView({
          behavior: "smooth"
        });

    }
  );

}


/* -------------------------
   CHIUSURA MODALE
------------------------- */

closeDialog.addEventListener(
  "click",
  () => {

    searchDialog.close();

  }
);


/* -------------------------
   TIPO IMMOBILE
------------------------- */

propertyChoices.forEach(
  button => {

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

  }
);


function updateDynamicFilters() {

  if (propertyType === "Stanza") {

    roomFilters.style.display =
      "block";

  } else {

    roomFilters.style.display =
      "none";

  }

}


/* -------------------------
   NAVIGAZIONE WIZARD
------------------------- */

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


/* -------------------------
   AGGIORNA WIZARD
------------------------- */

function updateWizard() {

  wizardSteps.forEach(
    step => {

      const stepNumber =
        Number(
          step.dataset.step
        );

      step.classList.toggle(
        "active",
        stepNumber === currentStep
      );

    }
  );


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

}


/* -------------------------
   VALIDAZIONE
------------------------- */

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


/* -------------------------
   RIEPILOGO
------------------------- */

function buildSearchSummary() {

  const city =
    searchWizard.elements
      .searchCity
      .value
      .trim();


  const poi =
    searchWizard.elements
      .poi
      .value
      .trim();


  const distance =
    searchWizard.elements
      .distance
      .value;


  const budget =
    searchWizard.elements
      .budget
      .value;


  const availableFrom =
    searchWizard.elements
      .availableFrom
      .value;


  const duration =
    searchWizard.elements
      .duration
      .value;


  const roomPreferences = [];


  if (propertyType === "Stanza") {

    if (
      searchWizard.elements
        .womenOnly
        .checked
    ) {

      roomPreferences.push(
        "solo donne"
      );

    }


    if (
      searchWizard.elements
        .menOnly
        .checked
    ) {

      roomPreferences.push(
        "solo uomini"
      );

    }


    if (
      searchWizard.elements
        .mixed
        .checked
    ) {

      roomPreferences.push(
        "coinquilini misti"
      );

    }


    if (
      searchWizard.elements
        .privateBathroom
        .checked
    ) {

      roomPreferences.push(
        "bagno privato"
      );

    }


    if (
      searchWizard.elements
        .petFriendly
        .checked
    ) {

      roomPreferences.push(
        "pet friendly"
      );

    }


    if (
      searchWizard.elements
        .couplesAllowed
        .checked
    ) {

      roomPreferences.push(
        "coppie ammesse"
      );

    }

  }


  let summary = `

    <div>

      <strong>
        ${escapeHtml(propertyType)}
        a
        ${escapeHtml(city)}
      </strong>

    </div>

  `;


  if (poi) {

    summary += `

      <div>
        📍 Vicino a
        <strong>
          ${escapeHtml(poi)}
        </strong>
      </div>

      <div>
        Entro
        <strong>
          ${escapeHtml(distance)} km
        </strong>
      </div>

    `;

  }


  if (budget) {

    summary += `

      <div>
        💶 Budget massimo:
        <strong>
          €${escapeHtml(budget)}
          /mese
        </strong>
      </div>

    `;

  }


  if (availableFrom) {

    summary += `

      <div>
        📅 Disponibile da:
        <strong>
          ${formatDate(
            availableFrom
          )}
        </strong>
      </div>

    `;

  }


  if (duration) {

    summary += `

      <div>
        ⏳ Durata:
        <strong>
          ${escapeHtml(duration)}
        </strong>
      </div>

    `;

  }


  if (
    roomPreferences.length > 0
  ) {

    summary += `

      <div>
        🏠 Preferenze stanza:
        <strong>
          ${roomPreferences
            .map(
              preference =>
                escapeHtml(
                  preference
                )
            )
            .join(", ")
          }
        </strong>
      </div>

    `;

  }


  searchSummary.innerHTML =
    summary;

}


/* -------------------------
   ATTIVA RICERCA DEMO
------------------------- */

function activateSearch() {

  const searchData = {

    id:
      typeof crypto !==
        "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),

    city:
      searchWizard.elements
        .searchCity
        .value
        .trim(),

    poi:
      searchWizard.elements
        .poi
        .value
        .trim(),

    distance:
      searchWizard.elements
        .distance
        .value,

    propertyType,

    budget:
      searchWizard.elements
        .budget
        .value,

    availableFrom:
      searchWizard.elements
        .availableFrom
        .value,

    duration:
      searchWizard.elements
        .duration
        .value,

    womenOnly:
      propertyType ===
        "Stanza"
        ? searchWizard.elements
            .womenOnly
            .checked
        : false,

    menOnly:
      propertyType ===
        "Stanza"
        ? searchWizard.elements
            .menOnly
            .checked
        : false,

    mixed:
      propertyType ===
        "Stanza"
        ? searchWizard.elements
            .mixed
            .checked
        : false,

    privateBathroom:
      propertyType ===
        "Stanza"
        ? searchWizard.elements
            .privateBathroom
            .checked
        : false,

    petFriendly:
      propertyType ===
        "Stanza"
        ? searchWizard.elements
            .petFriendly
            .checked
        : false,

    couplesAllowed:
      propertyType ===
        "Stanza"
        ? searchWizard.elements
            .couplesAllowed
            .checked
        : false,

    createdAt:
      new Date().toISOString()

  };


  localStorage.setItem(
    "affitti-smart-demo-search",
    JSON.stringify(
      searchData
    )
  );


  searchDialog.close();


  showSearchCreatedMessage(
    searchData
  );

}


/* -------------------------
   CONFERMA RICERCA
------------------------- */

function showSearchCreatedMessage(
  search
) {

  const poiText =
    search.poi
      ? ` vicino a ${search.poi}`
      : "";


  alert(
    `Ricerca creata!\n\n` +
    `${search.propertyType} a ` +
    `${search.city}` +
    `${poiText}.\n\n` +
    `Questa è ancora una demo: ` +
    `il monitoraggio automatico ` +
    `verrà collegato nella fase successiva.`
  );

}


/* -------------------------
   DATA
------------------------- */

function formatDate(dateString) {

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


/* -------------------------
   SICUREZZA TESTO
------------------------- */

function escapeHtml(value = "") {

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


/* -------------------------
   BETA FORM
------------------------- */

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
      "Nel prossimo passaggio collegheremo " +
      "il modulo al database reale.";


    betaMessage.style.color =
      "#0d6b5f";


    betaMessage.style.fontWeight =
      "800";

  }
);


/* -------------------------
   CLICK FUORI DAL DIALOG
------------------------- */

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


/* -------------------------
   INIZIALIZZAZIONE
------------------------- */

updateDynamicFilters();

updateWizard();
