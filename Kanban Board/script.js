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
const storageKey = "kanbanBoardState"; /* Thinking about this */

const board = document.querySelector(".board");
const addListButton = document.getElementById("add-list");
const searchInput = document.getElementById("search-input");
const createCategoryButton = document.getElementById("create-categories");
const deleteCategorySelect = document.getElementById("delete-categories");
const categoryFilterSelect = document.getElementById("category-select");
const projectSelect = document.getElementById("project-select");

/* <---- Startup ----> */
const state = loadState();

let activeDragCard = null;
let activeDragList = null;

function init() {
    if (addListButton) {
        addListButton.addEventListener("click", handleAddList);
    }
    if (createCategoryButton) {
        createCategoryButton.addEventListener("click", handleCreateCategory);
    }
    if (deleteCategorySelect) {
        deleteCategorySelect.addEventListener("change", handleDeleteCategory);
    }
    if (categoryFilterSelect) {
        categoryFilterSelect.addEventListener("change", handleCategoryFilter);
    }
    if (projectSelect) {
        projectSelect.addEventListener("change", handleProjectChange);
    }
    if (searchInput) {
        attachSearchHandler();
    }
    if (board) {
        board.addEventListener("click", handleBoardClick);
        board.addEventListener("dblclick", handleBoardDblClick);
        board.addEventListener("change", handleBoardChange);
        board.addEventListener("submit", handleBoardSubmit);
        board.addEventListener("keydown", handleBoardKeyDown);
        board.addEventListener("focusout", handleBoardFocusOut);
        board.addEventListener("dragstart", handleDragStart);
        board.addEventListener("dragend", handleDragEnd);
        board.addEventListener("dragover", handleDragOver);
        board.addEventListener("dragenter", handleDragEnter);
        board.addEventListener("dragleave", handleDragLeave);
        board.addEventListener("drop", handleDragDrop);
    } renderBoard();
} /* Re-render every update or filtration */

function loadState() {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return getDefaultState();
        } /* No Data */
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.lists) || !Array.isArray(parsed.categories)) {
            return getDefaultState();
        } /* Validates Lists and Categories */
        parsed.lists.forEach(list => {
            if (!Array.isArray(list.cards)) {
                list.cards = [];
            } /* Validates Cards in Lists */
        });
        return parsed;
    } catch (error) { return getDefaultState(); }
}

function getDefaultState() {
    return {
        lists: [{
                id: createId("list"),
                title: "To Do",
                cards: []
            }], categories: []
    };
}

function saveState() { 
    localStorage.setItem(storageKey, JSON.stringify(state));
}

function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
} /* Name - Base36 (0-9, a-z) without '0.' - Timestamp */

/* <---- Navigation Bar ----> */
function attachSearchHandler() {
    let searchTimeout = null;
    searchInput.addEventListener("input", e => {
        const value = e.target.value.trim().toLowerCase();
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { 
            renderBoard();
        }, 150);
    });
}

function handleAddList() {
    state.lists.push({
        id: createId("list"),
        title: "New List",
        cards: []
    });
    saveState();
    renderBoard();
}

function handleCreateCategory() {
    const name = prompt("Enter category name:");
    if (!name) { return; }
    const trimmed = name.trim();
    if (!trimmed) { return; }
    
    const exists = state.categories.some(category => category.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) { return; }
    
    state.categories.push({ id: createId("category"), name: trimmed });
    saveState();
    renderBoard();
}

function handleDeleteCategory(e) {
    const categoryId = e.target.value;
    if (!categoryId) { return; }

    state.categories = state.categories.filter(category => category.id !== categoryId);
    state.lists.forEach(list => {
        list.cards.forEach(card => {
            if (card.categoryId === categoryId) {
                card.categoryId = "";
            } /* Removes Category from Cards */
        });
    });
    saveState();
    renderBoard();
}

function handleCategoryFilter() { renderBoard(); }
function handleProjectChange() { renderBoard(); }
/* These can be completely removed later */

/* Board Logic */