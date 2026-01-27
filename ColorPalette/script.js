// DOM ELEMENTS
const generateBtn = document.getElementById("generate-btn");
const paletteContainer = document.querySelector(".palette-container");

const colorBox = document.querySelectorAll(".color-box");
const container = document.querySelector(".container");
const buttonGenerator = document.getElementById("generate-btn");

generateBtn.addEventListener("click", generatePalette);
paletteContainer.addEventListener("click", (e) => {
    // find the closest copy button/icon in case the user clicks an inner <i> or child element
    const copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
        const hexElement = copyBtn.previousElementSibling;
        const hexValue = hexElement ? hexElement.textContent : "";

        navigator.clipboard.writeText(hexValue)
            .then(() => {
                // prefer the icon element if present, otherwise use the button itself
                const icon = copyBtn.querySelector("i") || copyBtn;
                showCopySuccess(icon);
            })
            .catch((err) => console.log(err));
        return;
    }

    const colorEl = e.target.closest(".color");
    if (colorEl) {
        const details = colorEl.nextElementSibling;
        const hexEl = details ? details.querySelector(".hex-value") : null;
        const hexValue = hexEl ? hexEl.textContent : "";

        onColorClick(hexValue);

        navigator.clipboard.writeText(hexValue)
            .then(() => {
                const copyBtnEl = details ? details.querySelector(".copy-btn") : null;
                const icon = copyBtnEl ? (copyBtnEl.querySelector("i") || copyBtnEl) : null;
                if (icon) showCopySuccess(icon);
            })
            .catch((err) => console.log(err));
    }
})

function showCopySuccess(element) {
    if (!element) return;

    element.classList.remove("far", "fa-copy");
    element.classList.add("fa-solid", "fa-check");

    element.style.color = "#48bb78";

    // keep the check visible for 1.5s before reverting
    setTimeout(() => {
        element.classList.remove("fa-solid", "fa-check");
        element.classList.add("far", "fa-copy");

        element.style.color = "#111F35";
    }, 1500);
}

function generatePalette() {
    const colors = [];
    for (let i = 0; i < 8; i++) {
        colors.push(generateRandomColor());
        colorChangeEvent(colors[0], colors[7]);
    }

    updatePaletteDisplay(colors);
}

function generateRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";

    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]; // generate number from 0 - 15
    }

    return color;
}

function updatePaletteDisplay(colors) {
    const colorBoxes = document.querySelectorAll(".color-box")

    colorBoxes.forEach((box, index) => {
        const color = colors[index];
        const colorDiv = box.querySelector(".color");
        const hexValue = box.querySelector(".hex-value");

        colorDiv.style.backgroundColor = color;
        hexValue.textContent = color;
    })
}

onColorClick = (color) => {
    container.style.backgroundColor = color;
}

colorChangeEvent = (colorOne, colorTwo) => {
    buttonGenerator.style.background = `linear-gradient(45deg, ${colorOne}, ${colorTwo})`;
}

generatePalette(); // Generate palette on startup