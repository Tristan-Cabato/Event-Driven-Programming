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

/* ======== Changes ======== */

function dragStart(e) {
    if (e.target.closest("button, input, select, textarea")) { return; }
    /* Card Dragging */
    const card = e.target.closest(".card");
    if (card) {
        if (isFilterActive() || card.classList.contains("is-editing")) {
            return;
        } activeDragCard = card;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move"; // Maintains data being dragged
        e.dataTransfer.setData("text/plain", card.dataset.cardId || "");
        return;
    }
    /* List Dragging */
    const list = e.target.closest(".list");
    activeDragList = list;
    list.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", list.dataset.listId || "");
}

function handleDragEnd() {
    if (activeDragCard) {
        activeDragCard.classList.remove("dragging");
        activeDragCard = null;
        clearListHighlights();
        if (!isFilterActive()) {
            syncStateFromDom();
            saveState();
        } return;
    } // Save only when not searching or filtering
    if (activeDragList) {
        activeDragList.classList.remove("dragging");
        activeDragList = null;
        syncListsFromDom();
        saveState();
    }
}

function handleDragOver(e) {
    /* <---- List Dragging ----> */
    if (activeDragList) {
        e.preventDefault();
        const afterElement = getListAfterElement(board, e.clientX);
        if (!afterElement) { // Dragged to the very right
            if (activeDragList.parentElement !== board || activeDragList !== board.lastElementChild) {
                board.appendChild(activeDragList);
            } return;
        }
        if (afterElement === activeDragList) { return; }
        if (activeDragList.parentElement === board && activeDragList.nextElementSibling === afterElement) {
            return;
        } // Basically before the next element (Right position)
        board.insertBefore(activeDragList, afterElement);
        return;
    }
    const list = e.target.closest(".list");
    if (!list || !activeDragCard || isFilterActive()) { return; }
    
    /* <---- Card Dragging ----> */
    e.preventDefault();
    const cardList = list.querySelector(".card-list");
    if (!cardList) { return; }
    
    const afterElement = getDragAfterElement(cardList, e.clientY);
    if (!afterElement) {
        if (activeDragCard.parentElement !== cardList || activeDragCard !== cardList.lastElementChild) {
            cardList.appendChild(activeDragCard);
        } return;
    }
    if (afterElement === activeDragCard) { return; }
    if (activeDragCard.parentElement === cardList && activeDragCard.nextElementSibling === afterElement) { return; }
    cardList.insertBefore(activeDragCard, afterElement); // Same parent repositioning
}

function handleDragEnter(e) { // Can't reposition lists on state while filtering
    if (activeDragList) { return; }
    const list = e.target.closest(".list");
    if (!list || isFilterActive()) { return; }
    list.classList.add("over");
}

function handleDragLeave(e) { // Highlight while dragging 
    if (activeDragList) { return; }
    const list = e.target.closest(".list");
    if (!list || isFilterActive()) { return; }
    if (list.contains(e.relatedTarget)) { return; }
    list.classList.remove("over");
}

/* <!---- Continue from here ----> */

function handleDragDrop(e) {
    if (activeDragList) {
        e.preventDefault();
        syncListsFromDom();
        saveState();
        return;
    }
    const list = e.target.closest(".list");
    if (!list || isFilterActive()) {
        return;
    }
    e.preventDefault();
    list.classList.remove("over");
    syncStateFromDom();
    saveState();
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
function handleBoardClick(e) {
    const addCardButton = e.target.closest(".add-card");
    if (addCardButton) {
        renderBoard();
        return;
    }

    const deleteListButton = e.target.closest(".delete-list");
    if (deleteListButton) {
        state.lists = state.lists.filter(list => list.id !== listId);
        if (uiState.projectName && !state.lists.some(list => list.title === uiState.projectName)) {
            uiState.projectName = "";
        }
        if (!state.lists.length) {
            state.lists.push({ id: createId("list"), title: "To Do", cards: []});
        }
        saveState();
        renderBoard();
        return;
    }

    const editCardButton = e.target.closest(".card-action.edit");
    if (editCardButton) {
        renderBoard();
        return;
    }

    const deleteCardButton = e.target.closest(".card-action.delete");
    if (deleteCardButton) {
        const cardId = deleteCardButton.closest(".card").dataset.cardId;
        removeCardById(cardId);
        saveState();
        renderBoard();
        return;
    }

    const cancelCardButton = e.target.closest(".cancel-card");
    if (cancelCardButton) {
        renderBoard();
        return;
    }

    const cancelEditButton = e.target.closest(".cancel-edit");
    if (cancelEditButton) {
        renderBoard();
        return;
    }

    const tagRemoveButton = e.target.closest(".tag-remove");
    if (tagRemoveButton) {
        const cardId = tagRemoveButton.closest(".card").dataset.cardId;
        const card = findCardById(cardId);
        if (card) {
            card.categoryId = "";
            saveState();
            renderBoard();
        }
    }
}

function handleBoardChange(e) {
    const titleInput = e.target.closest(".list-title-input");
    if (!titleInput) { return; }
    if (!uiState.editingListId || uiState.editingListId !== titleInput.dataset.listId) { return; }
    commitListTitle(titleInput.dataset.listId, titleInput.value);
}

function handleBoardSubmit(e) {
    const form = e.target.closest("form"); /* I'll check what form is later */
    if (!form) { return; }
    e.preventDefault();

    if (form.classList.contains("card-form")) {
        const listId = form.dataset.listId;
        const list = state.lists.find(item => item.id === listId);
        if (!list) { return; }
        const title = form.querySelector("input[name='title']").value.trim();
        const categoryId = form.querySelector("select[name='category']").value;
        if (!title) { return; }
        list.cards.push({
            id: createId("card"),
            title,
            categoryId: categoryId || ""
        });
        saveState();
        renderBoard();
        return;
    }

    if (form.classList.contains("card-edit-form")) {
        const cardId = form.dataset.cardId;
        const card = findCardById(cardId);
        if (!card) { return; }
        const title = form.querySelector("input[name='title']").value.trim();
        const categoryId = form.querySelector("select[name='category']").value;
        if (!title) { return; }
        card.title = title;
        card.categoryId = categoryId || "";
        saveState();
        renderBoard();
    }
}