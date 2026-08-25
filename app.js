const STORAGE_KEY = "affitti-smart-listings";

let listings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentView = "all";

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
    if (wordsB.has(word)) common++;
  });

  return common / Math.max(wordsA.size, wordsB.size);
}

function getDuplicateScore(a, b) {
  let score = 0;

  const phoneA = normalizePhone(a.phone);
  const phoneB = normalizePhone(b.phone);

  if (phoneA && phoneB && phoneA === phoneB) {
    score += 60;
  }

  const addressSimilarity = similarity(a.address, b.address);

  if (addressSimilarity >= 0.8) {
    score += 35;
  } else if (addressSimilarity >= 0.5) {
    score += 20;
  }

  const titleSimilarity = similarity(a.title, b.title);

  if (titleSimilarity >= 0.7) {
    score += 15;
  }

  if (
    a.price &&
    b.price &&
    Math.abs(Number(a.price) - Number(b.price)) <= 50
  ) {
    score += 10;
  }

  if (
    a.rooms &&
    b.rooms &&
    Number(a.rooms) === Number(b.rooms)
  ) {
    score += 5;
  }

  return Math.min(score, 100);
}

function findDuplicateMatches(listing) {
  return listings
    .filter(other => other.id !== listing.id)
    .map(other => ({
      listing: other,
      score: getDuplicateScore(listing, other)
    }))
    .filter(match => match.score >= 50)
    .sort((a, b) => b.score - a.score);
}

function countDuplicateGroups() {
  const matchedIds = new Set();

  listings.forEach(listing => {
    const matches = findDuplicateMatches(listing);

    if (matches.length) {
      matchedIds.add(listing.id);

      matches.forEach(match => {
        matchedIds.add(match.listing.id);
      });
    }
  });

  return matchedIds.size;
}

function matchesFilters(listing) {
  const search = normalizeText(searchInput.value);

  if (search) {
    const haystack = normalizeText(
      `${listing.title} ${listing.address} ${listing.source}`
    );

    if (!haystack.includes(search)) {
      return false;
    }
  }

  const max = Number(maxPrice.value);

  if (max && Number(listing.price) > max) {
    return false;
  }

  const rooms = Number(minRooms.value);

  if (rooms && Number(listing.rooms) < rooms) {
    return false;
  }

  if (currentView === "favorites" && !listing.favorite) {
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

function createListingCard(listing) {
  const article = document.createElement("article");
  article.className = "listing-card";

  const matches = findDuplicateMatches(listing);
  const bestMatch = matches[0];

  article.innerHTML = `
    <div class="card-body">

      <div class="card-top">
        <span class="source-badge">
          ${listing.source || "Annuncio"}
        </span>

        <button
          class="fav-btn"
          type="button"
          aria-label="Preferito"
          data-id="${listing.id}"
        >
          ${listing.favorite ? "♥" : "♡"}
        </button>
      </div>

      <h3 class="listing-title">
        ${listing.title}
      </h3>

      <p class="listing-address">
        ${listing.address || "Indirizzo non indicato"}
      </p>

      <div class="facts">
        <strong class="listing-price">
          ${
            listing.price
              ? `€ ${Number(listing.price).toLocaleString("it-IT")}/mese`
              : "Prezzo non indicato"
          }
        </strong>

        <span class="listing-rooms">
          ${
            listing.rooms
              ? `${listing.rooms} locali`
              : ""
          }
        </span>
      </div>

      ${
        bestMatch
          ? `
            <div class="duplicate-badge">
              Possibile doppione: compatibilità ${bestMatch.score}%
            </div>
          `
          : ""
      }

      ${
        listing.phone
          ? `<p><strong>Telefono:</strong> ${listing.phone}</p>`
          : ""
      }

      ${
        listing.url
          ? `
            <p>
              <a
                href="${listing.url}"
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

  const filtered = listings.filter(matchesFilters);

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

  countListings.textContent = listings.length;
  countGroups.textContent = countDuplicateGroups();
  countFavs.textContent = listings.filter(
    item => item.favorite
  ).length;
}

openAdd.addEventListener("click", () => {
  addDialog.showModal();
});

closeAdd.addEventListener("click", () => {
  addDialog.close();
});

listingForm.addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(listingForm);

  const listing = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(),

    title: formData.get("title")?.trim() || "",
    address: formData.get("address")?.trim() || "",
    price: formData.get("price") || "",
    rooms: formData.get("rooms") || "",
    phone: formData.get("phone")?.trim() || "",
    source: formData.get("source")?.trim() || "",
    url: formData.get("url")?.trim() || "",
    favorite: false,
    createdAt: new Date().toISOString()
  };

  listings.unshift(listing);

  saveListings();
  listingForm.reset();
  addDialog.close();
  render();
});

listingsContainer.addEventListener("click", event => {
  const favoriteButton = event.target.closest(".fav-btn");

  if (favoriteButton) {
    const id = favoriteButton.dataset.id;

    const listing = listings.find(item => item.id === id);

    if (listing) {
      listing.favorite = !listing.favorite;
      saveListings();
      render();
    }

    return;
  }

  const deleteButton = event.target.closest("[data-delete-id]");

  if (deleteButton) {
    const id = deleteButton.dataset.deleteId;

    const confirmed = confirm(
      "Vuoi eliminare questo annuncio?"
    );

    if (!confirmed) return;

    listings = listings.filter(item => item.id !== id);

    saveListings();
    render();
  }
});

searchInput.addEventListener("input", render);
maxPrice.addEventListener("input", render);
minRooms.addEventListener("change", render);

clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  maxPrice.value = "";
  minRooms.value = "0";
  render();
});

navItems.forEach(button => {
  button.addEventListener("click", () => {
    navItems.forEach(item =>
      item.classList.remove("active")
    );

    button.classList.add("active");

    currentView = button.dataset.view;

    render();
  });
});

render();
