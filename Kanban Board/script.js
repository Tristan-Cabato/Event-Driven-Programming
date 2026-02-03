const cards = document.querySelectorAll(".card");
const lists = document.querySelectorAll(".list");

for (const card of cards) {
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("dragend", dragEnd);
}

for (const list of lists) {
    list.addEventListener("dragover", dragOver);
    list.addEventListener("dragenter", dragEnter);
    list.addEventListener("dragleave", dragLeave);
    list.addEventListener("drop", dragDrop);
}

function dragStart(e) { e.dataTransfer.setData("text/plain", e.target.id); }
function dragEnd() { console.log("Dragged Something"); }
function dragOver(e) { e.preventDefault(); }
function dragEnter(e) {
    e.preventDefault();
    this.classList.add("over");
}
function dragLeave(e) { this.classList.remove("over"); }
function dragDrop(e) {
    const id = e.dataTransfer.getData("text/plain");
    const card = document.getElementById(id);
    this.appendChild(card);
    this.classList.remove("over");
}

/* ======= New Code ========== */

/* Category Logic */
const categoryList = ['test', 'test2']; /* Text Content Only */

const categoryCreator = document.getElementById("create-categories");
const deleteCategory = document.getElementById("delete-categories");
const categories = document.getElementById("categories"); /* In the card */

categoryCreator.addEventListener("click", createCategory);
function createCategory() {
    const categoryName = prompt("Enter category name:");
    if (categoryName) {
        categoryList.push(categoryName);
        console.log(categoryList);
    }
}

function displayDeleteList() {
    deleteCategory.innerHTML = '<option>Delete Category</option>';
    
    categoryList.forEach(category => {
        const option = new Option(category);
        deleteCategory.add(option);
    });
}
function displayCardList() {
    categories.innerHTML = '<option>Default</option>';
    
    categoryList.forEach(category => {
        const option = new Option(category);
        categories.add(option);
    });
}

// Dropdowns on page load
document.addEventListener('DOMContentLoaded', () => {
    displayDeleteList();
    displayCardList();
});
