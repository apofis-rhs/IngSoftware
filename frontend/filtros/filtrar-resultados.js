// filtrar resultados - logica especifica
const pills = document.querySelectorAll(".pill");

pills.forEach(button => {
    button.addEventListener("click", () => {

        const parent = button.parentElement;

        parent.querySelectorAll(".pill").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
    });
});

const applyBtn = document.querySelector(".btn-apply");
const clearBtn = document.querySelector(".btn-clear");

applyBtn.addEventListener("click", () => {
    alert("Filtro aplicado");
});

clearBtn.addEventListener("click", () => {

    document.querySelectorAll(".pill").forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById("priceRange").value = 400;
});