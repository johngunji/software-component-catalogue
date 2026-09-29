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

    /*
        Later this will become:

        GET /api/components/search?q=query

        For now we simply demonstrate
        the frontend behaviour.
    */

    alert(
        `Searching for components matching: "${query}"`
    );
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

const categories =
    document.querySelectorAll(".category-card");


categories.forEach(function(card) {

    card.addEventListener(
        "click",
        function() {

            const category =
                card.dataset.category;

            /*
                Later:

                window.location.href =
                `/browse?category=${category}`
            */

            alert(
                `Opening category: ${category}`
            );

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

        event.preventDefault();

        modal.classList.add("show");

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

        document
            .getElementById("categories")
            .scrollIntoView({
                behavior: "smooth"
            });

    }
);