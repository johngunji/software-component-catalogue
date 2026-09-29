/* =========================
   INITIALIZE ICONS
========================= */

lucide.createIcons();


/* =========================
   SEARCH
========================= */

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");


function performSearch() {

    const query =
        searchInput.value.trim();

    if (query === "") {

        searchInput.focus();

        return;
    }

    window.location.href =
        `pages/search.html?q=${encodeURIComponent(query)}`;
}


searchBtn.addEventListener(
    "click",
    performSearch
);


searchInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            performSearch();

        }

    }
);


/* =========================
   POPULAR SEARCH CHIPS
========================= */

const chips =
    document.querySelectorAll(".search-chip");


chips.forEach(function(chip) {

    chip.addEventListener(
        "click",
        function() {

            searchInput.value =
                chip.textContent.trim();

            searchInput.focus();

            performSearch();

        }
    );

});


/* =========================
   CATEGORY CARDS
========================= */

const categoryCards =
    document.querySelectorAll(".category-card");


categoryCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            const category =
                card.dataset.category;

            window.location.href =
                `pages/browse.html?category=${encodeURIComponent(category)}`;

        }
    );

});


/* =========================
   ADD COMPONENT MODAL
========================= */

const modal =
    document.getElementById("modal");

const addComponentBtn =
    document.getElementById("addComponentBtn");

const closeModal =
    document.getElementById("closeModal");


addComponentBtn.addEventListener(
    "click",
    function(event) {

        window.location.href =
            "pages/add-component.html";

    }
);


closeModal.addEventListener(
    "click",
    function() {

        modal.classList.remove("show");

    }
);


modal.addEventListener(
    "click",
    function(event) {

        if (event.target === modal) {

            modal.classList.remove("show");

        }

    }
);


/* =========================
   VIEW ALL CATEGORIES
========================= */

const viewCategories =
    document.getElementById("viewCategories");


viewCategories.addEventListener(
    "click",
    function() {

        window.location.href =
            "pages/browse.html";

    }
);