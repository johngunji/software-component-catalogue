const form =
    document.getElementById("componentForm");

const successMessage =
    document.getElementById("successMessage");

const cancelButton =
    document.getElementById("cancelButton");


function hideErrors() {

    document
        .querySelectorAll(".error")
        .forEach(error => {

            error.style.display = "none";

        });

}


function validateForm() {

    hideErrors();

    let valid = true;


    const name =
        document.getElementById("componentName").value.trim();

    const category =
        document.getElementById("category").value;

    const description =
        document.getElementById("description").value.trim();

    const type =
        document.getElementById("type").value;


    if (name === "") {

        document.getElementById("nameError")
            .style.display = "block";

        valid = false;

    }


    if (category === "") {

        document.getElementById("categoryError")
            .style.display = "block";

        valid = false;

    }


    if (description === "") {

        document.getElementById("descriptionError")
            .style.display = "block";

        valid = false;

    }


    if (type === "") {

        valid = false;

        alert("Please select a component type.");

    }


    return valid;

}


form.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        if (!validateForm()) {

            return;

        }


        /*
         * Temporary frontend behaviour.
         *
         * Later this object will be sent
         * to the backend API using fetch().
         */

        const component = {

            name:
                document
                    .getElementById("componentName")
                    .value
                    .trim(),

            category:
                document
                    .getElementById("category")
                    .value,

            description:
                document
                    .getElementById("description")
                    .value
                    .trim(),

            type:
                document
                    .getElementById("type")
                    .value,

            language:
                document
                    .getElementById("language")
                    .value
                    .trim(),

            keywords:
                document
                    .getElementById("keywords")
                    .value
                    .trim(),

            resourceUrl:
                document
                    .getElementById("resourceUrl")
                    .value
                    .trim()

        };


        console.log(
            "Component submitted:",
            component
        );


        successMessage.style.display =
            "block";


        form.reset();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


cancelButton.addEventListener(
    "click",
    function() {

        window.location.href =
            "../index.html";

    }
);


lucide.createIcons();