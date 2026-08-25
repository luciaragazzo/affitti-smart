const STORAGE_KEY = "affitti-smart-listings";

let listings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentView = "all";
let currentPhotoHash = "";
let currentPhotoPreview = "";

const openAdd = document.getElementById("openAdd");
const closeAdd = document.getElementById("closeAdd");
const addDialog = document.getElementById("addDialog");
const listingForm = document.getElementById("listingForm");
const listingsContainer = document.getElementById("listings");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const maxPrice = document.getElementById("maxPrice");
const minRooms = document.getElementById("minRooms");
const clearFilters = document.getElementById("clearFilters");

const countListings = document.getElementById("countListings");
const countGroups = document.getElementById("countGroups");
const countFavs = document.getElementById("countFavs");

const navItems = document.querySelectorAll(".nav-item");

const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const photoPreviewImage = document.getElementById("photoPreviewImage");

function saveListings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
}

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizePhone(value = "") {
  return value.replace(/\D/g, "").replace(/^39/, "");
}

function similarity(a, b) {
  const first = normalizeText(a);
  const second = normalizeText(b);

  if (!first || !second) return 0;
  if (first === second) return 1;

  const wordsA = new Set(first.split(" "));
  const wordsB = new Set(second.split(" "));

  let common = 0;

  wordsA.forEach(word => {
    if (wordsB.has(word)) {
      common++;
    }
  });

  return common / Math.max(wordsA.size, wordsB.size);
}

function hammingSimilarity(hashA, hashB) {
  if (!hashA || !hashB) return 0;
  if (hashA.length !== hashB.length) return 0;

  let equal = 0;

  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] === hashB[i]) {
      equal++;
    }
  }

  return equal / hashA.length;
}

function createImageHash(image) {
  const size = 16;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true
  });

  ctx.drawImage(image, 0, 0, size, size);

  const imageData = ctx.getImageData(
    0,
    0,
    size,
    size
  ).data;

  const grayscale = [];

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];

    const gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;

    grayscale.push(gray);
  }

  const average =
    grayscale.reduce((sum, value) => sum + value, 0) /
    grayscale.length;

  return grayscale
    .map(value => value >= average ? "1" : "0")
    .join("");
}

function compressPhoto(image) {
  const maxWidth = 640;
  const maxHeight = 420;

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  const ratio = Math.min(
    maxWidth / width,
    maxHeight / height,
    1
  );

  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  return canvas.toDataURL(
    "image/jpeg",
    0.7
  );
}

function loadPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve({
        hash: "",
        preview: ""
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        try {
          const hash = createImageHash(image);
          const preview = compressPhoto(image);

          resolve({
            hash,
            preview
          });
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getDuplicateScore(a, b) {
  let score = 0;
  let photoSimilarity = 0;

  const phoneA = normalizePhone(a.phone);
  const phoneB = normalizePhone(b.phone);

  if (
    phoneA &&
    phoneB &&
    phoneA === phoneB
  ) {
    score += 45;
  }

  const addressSimilarity =
    similarity(a.address, b.address);

  if (addressSimilarity >= 0.85) {
    score += 30;
  } else if (addressSimilarity >= 0.6) {
    score += 20;
  } else if (addressSimilarity >= 0.4) {
    score += 10;
  }

  if (a.photoHash && b.photoHash) {
    photoSimilarity = hammingSimilarity(
      a.photoHash,
      b.photoHash
    );

    if (photoSimilarity >= 0.94) {
      score += 55;
    } else if (photoSimilarity >= 0.9) {
      score += 45;
    } else if (photoSimilarity >= 0.84) {
      score += 30;
    } else if (photoSimilarity >= 0.78) {
      score += 15;
    }
  }

  const titleSimilarity =
    similarity(a.title, b.title);

  if (titleSimilarity >= 0.75) {
    score += 12;
  } else if (titleSimilarity >= 0.5) {
    score += 6;
  }

  if (
    a.price &&
    b.price
  ) {
    const difference =
      Math.abs(
        Number(a.price) -
        Number(b.price)
      );

    if (difference === 0) {
      score += 8;
    } else if (difference <= 50) {
      score += 5;
    } else if (difference <= 100) {
      score += 2;
    }
  }

  if (
    a.rooms &&
    b.rooms &&
    Number(a.rooms) === Number(b.rooms)
  ) {
    score += 5;
  }

  return {
    score: Math.min(score, 100),
    photoSimilarity: Math.round(
      photoSimilarity * 100
    )
  };
}

function findDuplicateMatches(listing) {
  return listings
    .filter(other => other.id !== listing.id)
    .map(other => {
      const result =
        getDuplicateScore(listing, other);

      return {
        listing: other,
        score: result.score,
        photoSimilarity:
          result.photoSimilarity
      };
    })
    .filter(match => match.score >= 50)
    .sort((a, b) => b.score - a.score);
}

function getDuplicateGroups() {
  const visited = new Set();
  let groups = 0;

  listings.forEach(listing => {
    if (visited.has(listing.id)) {
      return;
    }

    const matches =
      findDuplicateMatches(listing);

    if (matches.length > 0) {
      groups++;
      visited.add(listing.id);

      matches.forEach(match => {
        visited.add(match.listing.id);
      });
    }
  });

  return groups;
}

function matchesFilters(listing) {
  const search =
    normalizeText(searchInput.value);

  if (search) {
    const haystack =
      normalizeText(
        `${listing.title} ${listing.address} ${listing.source}`
      );

    if (!haystack.includes(search)) {
      return false;
    }
  }

  const max =
    Number(maxPrice.value);

  if (
    max &&
    Number(listing.price) > max
  ) {
    return false;
  }

  const rooms =
    Number(minRooms.value);

  if (
    rooms &&
    Number(listing.rooms) < rooms
  ) {
    return false;
  }

  if (
    currentView === "favorites" &&
    !listing.favorite
  ) {
    return false;
  }

  if (
    currentView === "duplicates" &&
    findDuplicateMatches(listing).length === 0
  ) {
    return false;
  }

  return true;
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createListingCard(listing) {
  const article =
    document.createElement("article");

  article.className = "listing-card";

  const matches =
    findDuplicateMatches(listing);

  const bestMatch =
    matches[0];

  let duplicateHtml = "";

  if (bestMatch) {
    duplicateHtml = `
      <div class="duplicate-badge">
        Possibile stesso appartamento:
        compatibilità ${bestMatch.score}%
      </div>
    `;

    if (bestMatch.photoSimilarity > 0) {
      duplicateHtml += `
        <div class="photo-match-badge">
          Foto simile:
          ${bestMatch.photoSimilarity}%
        </div>
      `;
    }
  }

  article.innerHTML = `
    ${
      listing.photoPreview
        ? `
          <img
            class="listing-photo"
            src="${listing.photoPreview}"
            alt="Foto dell'annuncio"
          >
        `
        : ""
    }

    <div class="card-body">

      <div class="card-top">
        <span class="source-badge">
          ${escapeHtml(
            listing.source || "Annuncio"
          )}
        </span>

        <button
          class="fav-btn"
          type="button"
          aria-label="Preferito"
          data-id="${listing.id}"
        >
          ${
            listing.favorite
              ? "♥"
              : "♡"
          }
        </button>
      </div>

      <h3 class="listing-title">
        ${escapeHtml(listing.title)}
      </h3>

      <p class="listing-address">
        ${
          escapeHtml(
            listing.address ||
            "Indirizzo non indicato"
          )
        }
      </p>

      <div class="facts">
        <strong class="listing-price">
          ${
            listing.price
              ? `€ ${Number(
                  listing.price
                ).toLocaleString(
                  "it-IT"
                )}/mese`
              : "Prezzo non indicato"
          }
        </strong>

        <span class="listing-rooms">
          ${
            listing.rooms
              ? `${escapeHtml(
                  String(listing.rooms)
                )} locali`
              : ""
          }
        </span>
      </div>

      ${duplicateHtml}

      ${
        listing.phone
          ? `
            <p>
              <strong>
                Telefono:
              </strong>
              ${escapeHtml(listing.phone)}
            </p>
          `
          : ""
      }

      ${
        listing.url
          ? `
            <p>
              <a
                href="${escapeHtml(
                  listing.url
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apri annuncio originale
              </a>
            </p>
          `
          : ""
      }

      <button
        class="delete-btn"
        type="button"
        data-delete-id="${listing.id}"
      >
        Elimina
      </button>

    </div>
  `;

  return article;
}

function render() {
  listingsContainer.innerHTML = "";

  const filtered =
    listings.filter(matchesFilters);

  if (filtered.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";

    filtered.forEach(listing => {
      listingsContainer.appendChild(
        createListingCard(listing)
      );
    });
  }

  countListings.textContent =
    listings.length;

  countGroups.textContent =
    getDuplicateGroups();

  countFavs.textContent =
    listings.filter(
      item => item.favorite
    ).length;
}

function resetPhoto() {
  currentPhotoHash = "";
  currentPhotoPreview = "";

  photoPreviewImage.src = "";
  photoPreview.hidden = true;
}

openAdd.addEventListener(
  "click",
  () => {
    addDialog.showModal();
  }
);

closeAdd.addEventListener(
  "click",
  () => {
    addDialog.close();
    listingForm.reset();
    resetPhoto();
  }
);

photoInput.addEventListener(
  "change",
  async event => {
    const file =
      event.target.files[0];

    if (!file) {
      resetPhoto();
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert(
        "Seleziona un file immagine."
      );

      photoInput.value = "";
      resetPhoto();
      return;
    }

    try {
      const result =
        await loadPhoto(file);

      currentPhotoHash =
        result.hash;

      currentPhotoPreview =
        result.preview;

      photoPreviewImage.src =
        result.preview;

      photoPreview.hidden = false;
    } catch (error) {
      console.error(error);

      alert(
        "Non sono riuscito a leggere la foto."
      );

      resetPhoto();
    }
  }
);

listingForm.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const formData =
      new FormData(listingForm);

    const listing = {
      id:
        typeof crypto !== "undefined" &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString(),

      title:
        formData
          .get("title")
          ?.trim() || "",

      address:
        formData
          .get("address")
          ?.trim() || "",

      price:
        formData.get("price") || "",

      rooms:
        formData.get("rooms") || "",

      phone:
        formData
          .get("phone")
          ?.trim() || "",

      source:
        formData
          .get("source")
          ?.trim() || "",

      url:
        formData
          .get("url")
          ?.trim() || "",

      photoHash:
        currentPhotoHash,

      photoPreview:
        currentPhotoPreview,

      favorite: false,

      createdAt:
        new Date().toISOString()
    };

    listings.unshift(listing);

    try {
      saveListings();
    } catch (error) {
      console.error(error);

      alert(
        "La memoria del browser è piena. " +
        "Prova a eliminare alcuni annunci."
      );

      listings.shift();
      return;
    }

    listingForm.reset();
    resetPhoto();
    addDialog.close();

    render();
  }
);

listingsContainer.addEventListener(
  "click",
  event => {
    const favoriteButton =
      event.target.closest(
        ".fav-btn"
      );

    if (favoriteButton) {
      const id =
        favoriteButton.dataset.id;

      const listing =
        listings.find(
          item => item.id === id
        );

      if (listing) {
        listing.favorite =
          !listing.favorite;

        saveListings();
        render();
      }

      return;
    }

    const deleteButton =
      event.target.closest(
        "[data-delete-id]"
      );

    if (deleteButton) {
      const id =
        deleteButton.dataset.deleteId;

      const confirmed =
        confirm(
          "Vuoi eliminare questo annuncio?"
        );

      if (!confirmed) {
        return;
      }

      listings =
        listings.filter(
          item => item.id !== id
        );

      saveListings();
      render();
    }
  }
);

searchInput.addEventListener(
  "input",
  render
);

maxPrice.addEventListener(
  "input",
  render
);

minRooms.addEventListener(
  "change",
  render
);

clearFilters.addEventListener(
  "click",
  () => {
    searchInput.value = "";
    maxPrice.value = "";
    minRooms.value = "0";

    render();
  }
);

navItems.forEach(button => {
  button.addEventListener(
    "click",
    () => {
      navItems.forEach(item => {
        item.classList.remove(
          "active"
        );
      });

      button.classList.add(
        "active"
      );

      currentView =
        button.dataset.view;

      render();
    }
  );
});

addDialog.addEventListener(
  "click",
  event => {
    const rect =
      addDialog.getBoundingClientRect();

    const clickedOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (clickedOutside) {
      addDialog.close();
      listingForm.reset();
      resetPhoto();
    }
  }
);

render();
