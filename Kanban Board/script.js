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

function handleDragDrop(e) {
    /* Synchronize data */
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

    /* Highlight Removal */
    e.preventDefault();
    list.classList.remove("over");
    syncStateFromDom();
    saveState();
}

/* ======= New Code ========== */
const storageKey = "kanbanBoardState"; /* Thinking about this */

let board = document.querySelector(".board");
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

// For card editing
let uiState = { editingCardId: null, activeFormListId: null, filterText: "", filterCategory: "", projectName: "" };

function isFilterActive() {
    // Use lightweight UI state for filtering
    return (uiState.filterText && uiState.filterText.length > 0) || (uiState.filterCategory && uiState.filterCategory !== "" && uiState.filterCategory !== "all");
}


function init() {
    if (!board) { // Retry if board is somehow not initialized
        setTimeout(init, 50);
        return;
    }
    if (addListButton) { addListButton.addEventListener("click", handleAddList); }
    if (createCategoryButton) { createCategoryButton.addEventListener("click", handleCreateCategory); }
    if (deleteCategorySelect) { deleteCategorySelect.addEventListener("change", handleDeleteCategory); }
    if (categoryFilterSelect) { categoryFilterSelect.addEventListener("change", handleCategoryFilter); }
    if (projectSelect) { projectSelect.addEventListener("change", handleProjectChange); }
    if (searchInput) { attachSearchHandler(); }
    if (board) {
        board.addEventListener("click", handleBoardClick);
        board.addEventListener("dblclick", handleBoardDblClick);
        board.addEventListener("change", handleBoardChange);
        board.addEventListener("submit", handleBoardSubmit);
        board.addEventListener("keydown", handleBoardKeyDown);
        board.addEventListener("focusout", handleBoardFocusOut);
        board.addEventListener("dragstart", dragStart);
        board.addEventListener("dragend", handleDragEnd);
        board.addEventListener("dragover", handleDragOver);
        board.addEventListener("dragenter", handleDragEnter);
        board.addEventListener("dragleave", handleDragLeave);
        board.addEventListener("drop", handleDragDrop);
    } renderBoard();
}

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

/* <!---- Group Creators ----> */
function createListElement(list, filteredCards) {
    const listElement = document.createElement("div");
    listElement.className = "list";
    listElement.dataset.listId = list.id;
    listElement.draggable = true;

    const header = document.createElement("div");
    header.className = "list-header";

    const titleDisplay = document.createElement("div");
    titleDisplay.className = "list-title-display";
    titleDisplay.textContent = list.title;
    titleDisplay.dataset.listId = list.id;

    const titleInput = document.createElement("input");
    titleInput.className = "list-title-input";
    titleInput.type = "text";
    titleInput.value = list.title;
    titleInput.dataset.listId = list.id;
    titleInput.id = `list-title-${list.id}`;
    titleInput.setAttribute("aria-label", "List title");

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "list-buttons";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-list";
    deleteButton.textContent = "🗑";
    deleteButton.setAttribute("aria-label", "Delete list");

    buttonGroup.appendChild(deleteButton);
    header.appendChild(titleDisplay);
    header.appendChild(titleInput);
    header.appendChild(buttonGroup);

    const cardList = document.createElement("div");
    cardList.className = "card-list";

    const cardsToRender = filteredCards || list.cards;
    cardsToRender.forEach(card => {
        cardList.appendChild(createCardElement(card, list.id));
    });

    const addCardButton = document.createElement("button");
    addCardButton.type = "button";
    addCardButton.className = "add-card";
    addCardButton.textContent = "Add Card";

    listElement.appendChild(header);
    listElement.appendChild(cardList);
    listElement.appendChild(addCardButton);
    // Thinking about this, it seems to be passively appending outside the add list button
    if (uiState.activeFormListId === list.id) {
        listElement.appendChild(createCardForm(list.id));
    } return listElement;
}

function createCardElement(card, listId) {
    if (uiState.editingCardId === card.id) {
        return createCardEditForm(card, listId);
    }
    
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.draggable = !isFilterActive();
    cardElement.dataset.cardId = card.id;
    cardElement.dataset.listId = listId;

    
    const content = document.createElement("div");
    content.className = "card-content";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = card.title;

    content.appendChild(title);

    if (card.categoryId) {
        const tags = document.createElement("div");
        tags.className = "card-tags";

        const tag = document.createElement("span");
        tag.className = "card-tag";
        tag.textContent = getCategoryName(card.categoryId);

        tags.appendChild(tag);
        content.appendChild(tags);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "card-action edit";
    editButton.textContent = "✎";
    editButton.setAttribute("aria-label", "Edit card");
    
    // Add direct click listener
    editButton.addEventListener("click", function(e) {
        e.stopPropagation();
        const cardElement = this.closest(".card");
        const cardId = cardElement ? cardElement.dataset.cardId : null;
        if (cardId) {
            uiState.editingCardId = cardId;
            uiState.activeFormListId = null;
            renderBoard();
        }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "card-action delete";
    deleteButton.textContent = "🗑";
    deleteButton.setAttribute("aria-label", "Delete card");
    
    // Add direct click listener
    deleteButton.addEventListener("click", function(e) {
        e.stopPropagation();
        const cardId = this.closest(".card").dataset.cardId;
        removeCardById(cardId);
        saveState();
        renderBoard();
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    cardElement.appendChild(content);
    cardElement.appendChild(actions);
    return cardElement;
}

function createCardForm(listId) {
    const form = document.createElement("form");
    form.className = "card-form";
    form.dataset.listId = listId;

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.placeholder = "Task name";
    titleInput.required = true;

    const categorySelect = createCategorySelect("");

    const actions = document.createElement("div");
    actions.className = "form-actions";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "submit";
    submitButton.textContent = "Add";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "cancel cancel-card";
    cancelButton.textContent = "Cancel";

    actions.appendChild(submitButton);
    actions.appendChild(cancelButton);

    form.appendChild(titleInput);
    form.appendChild(categorySelect);
    form.appendChild(actions);

    return form;
}

function createCardEditForm(card, listId) {
    const form = document.createElement("form");
    form.className = "card-edit-form";
    form.dataset.cardId = card.id;
    form.dataset.listId = listId;

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.value = card.title;
    titleInput.required = true;

    const tags = document.createElement("div");
    tags.className = "card-tags";

    if (card.categoryId) {
        const tag = document.createElement("span");
        tag.className = "card-tag";
        tag.textContent = getCategoryName(card.categoryId);

        const remove = document.createElement("span");
        remove.className = "tag-remove";
        remove.textContent = "x";

        tag.appendChild(remove);
        tags.appendChild(tag);
    }

    const categorySelect = createCategorySelect(card.categoryId);

    const actions = document.createElement("div");
    actions.className = "form-actions";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "submit";
    submitButton.textContent = "Save";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "cancel cancel-edit";
    cancelButton.textContent = "Cancel";

    actions.appendChild(submitButton);
    actions.appendChild(cancelButton);

    form.appendChild(titleInput);
    form.appendChild(tags);
    form.appendChild(categorySelect);
    form.appendChild(actions);

    return form;
}

function createCategorySelect(selectedId) {
    const select = document.createElement("select");
    select.name = "category";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No category";
    select.appendChild(option);

    state.categories.forEach(category => {
        const categoryOption = document.createElement("option");
        categoryOption.value = category.id;
        categoryOption.textContent = category.name;
        if (category.id === selectedId) {
            categoryOption.selected = true;
        }
        select.appendChild(categoryOption);
    });
    return select;
}

function getCategoryName(categoryId) {
    const category = state.categories.find(item => item.id === categoryId);
    return category ? category.name : "";
}

function matchesFilter(card, listMatches) {
    const filterText = uiState.filterText;
    const filterCategory = uiState.filterCategory;
    const textMatch = !filterText || listMatches || ((card.title || "").toLowerCase().includes(filterText)) || getCategoryName(card.categoryId).toLowerCase().includes(filterText);
    const categoryMatch = !filterCategory || filterCategory === "all" || card.categoryId === filterCategory;
    return textMatch && categoryMatch;
}

function renderCategoryControls() {
    if (categoryFilterSelect) {
        categoryFilterSelect.innerHTML = "";
        categoryFilterSelect.appendChild(createPlaceholderOption("Tags"));
        categoryFilterSelect.appendChild(new Option("All Tags", "all"));
        state.categories.forEach(category => {
            categoryFilterSelect.add(new Option(category.name, category.id));
        });
        categoryFilterSelect.value = "";
        if (!categoryFilterSelect.value) {
            categoryFilterSelect.selectedIndex = 0;
        }
    }
    if (deleteCategorySelect) {
        deleteCategorySelect.innerHTML = "";
        deleteCategorySelect.appendChild(createPlaceholderOption("Delete Category"));
        state.categories.forEach(category => {
            deleteCategorySelect.add(new Option(category.name, category.id));
        });
    }
}

function renderProjectControls() {
    if (!projectSelect) { return; }
    projectSelect.innerHTML = "";
    projectSelect.appendChild(createPlaceholderOption("Projects"));
    projectSelect.add(new Option("All Projects", "all"));
    state.lists.forEach(list => {
        projectSelect.add(new Option(list.title, list.title));
    });
    projectSelect.value = uiState.projectName || "";
    if (!projectSelect.value) {
        projectSelect.selectedIndex = 0;
    }
}


function createPlaceholderOption(label) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = label;
    option.disabled = true;
    option.hidden = true;
    option.selected = true;
    return option;
}

function findCardById(cardId) {
    for (const list of state.lists) {
        const card = list.cards.find(item => item.id === cardId);
        if (card) {
            return card;
        }
    }
    return null;
}

function removeCardById(cardId) {
    state.lists.forEach(list => {
        list.cards = list.cards.filter(card => card.id !== cardId);
    });
}

function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
} /* Name - Base36 (0-9, a-z) without '0.' - Timestamp */

function renderBoard() {
    if (!board) { return; }
    while (board.firstChild) { board.removeChild(board.firstChild); }
    state.lists.forEach(list => {
        if (uiState.projectName && uiState.projectName !== "" && list.title !== uiState.projectName) {
            return;
        }
        // Build filtered cards based on search (uiState.filterText) and category
        const listMatches = uiState.filterText ? (list.title.toLowerCase().includes(uiState.filterText)) : false;
        let cards = list.cards;
        if (uiState.filterText && uiState.filterText.length > 0) {
            cards = list.cards.filter(card => (
                card.title.toLowerCase().includes(uiState.filterText) ||
                (card.categoryId && getCategoryName(card.categoryId).toLowerCase().includes(uiState.filterText)) ||
                list.title.toLowerCase().includes(uiState.filterText)
            ));
        }
        if (uiState.filterCategory && uiState.filterCategory !== "" && uiState.filterCategory !== "all") {
            cards = cards.filter(card => card.categoryId === uiState.filterCategory);
        }
        if (isFilterActive() && !(listMatches || cards.length > 0)) {
            return;
        }
        board.appendChild(createListElement(list, cards));
    });
    renderCategoryControls();
    renderProjectControls();
}

/* <!---- State Management ----> */
function syncListsFromDom() {
    if (!board) { return; }
    const listMap = new Map();
    state.lists.forEach(list => listMap.set(list.id, list));
    const ordered = [];
    board.querySelectorAll(".list").forEach(listElement => {
        const list = listMap.get(listElement.dataset.listId);
        if (list) { ordered.push(list); }
    });
    if (ordered.length) { state.lists = ordered; }
}

function syncStateFromDom() { /* Mostly Card Data */
    if (!board) { return; }
    const cardMap = new Map();
    state.lists.forEach(list => {
        list.cards.forEach(card => cardMap.set(card.id, card));
        list.cards = [];
    });
    const listElements = board.querySelectorAll(".list");
    listElements.forEach(listElement => { /* Cards in Lists */
        const listId = listElement.dataset.listId;
        const list = state.lists.find(item => item.id === listId);
        if (!list) { return; }
        const cards = listElement.querySelectorAll(".card");
        cards.forEach(cardElement => {
            const card = cardMap.get(cardElement.dataset.cardId);
            if (card) { list.cards.push(card); }
        });
    });
}

/* <---- Navigation Bar ----> */
function attachSearchHandler() {
    let searchTimeout = null;
    searchInput.addEventListener("input", e => {
        const value = e.target.value.trim().toLowerCase();
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { 
            uiState.filterText = value;
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

function handleCategoryFilter(e) {
    uiState.filterCategory = e.target.value;
    renderBoard();
}
function handleProjectChange(e) {
    const value = e.target.value;
    uiState.projectName = value === "all" ? "" : value;
    renderBoard();
}

/* <!---- Board Logic ----> */
function handleBoardClick(e) {
    const addCardButton = e.target.closest(".add-card");
    if (addCardButton) {
        const list = addCardButton.closest('.list');
        const listId = list ? list.dataset.listId : null;
        if (listId) {
            uiState.activeFormListId = listId;
            renderBoard();
        }
        return;
    }

    const deleteListButton = e.target.closest(".delete-list");
    if (deleteListButton) {
        const list = deleteListButton.closest('.list');
        const listId = list ? list.dataset.listId : null;
        if (!listId) { return; }
        state.lists = state.lists.filter(l => l.id !== listId);
        if (!state.lists.length) {
            state.lists.push({ id: createId("list"), title: "To Do", cards: []});
        }
        saveState();

        if (uiState.activeFormListId) { uiState.activeFormListId = null; }
        renderBoard();
        return;
    }

    const cancelCardButton = e.target.closest(".cancel-card");
    if (cancelCardButton) {
        uiState.activeFormListId = null;
        renderBoard();
        return;
    }

    const cancelEditButton = e.target.closest(".cancel-edit");
    if (cancelEditButton) {
        uiState.editingCardId = null;
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
        activeFormListId = null;
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

/* <!---- Dragging ----> */
function getDragAfterElement(container, y) {
    /* Handles Card Positioning */
    const cards = Array.from(container.querySelectorAll(".card:not(.dragging)"));
    return cards.reduce((closest, card) => {
        const box = card.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) { 
            return { offset, element: card };
        } return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function getListAfterElement(container, x) {
    /* Handles List Positioning */
    const lists = Array.from(container.querySelectorAll(".list:not(.dragging)"));
    return lists.reduce((closest, list) => {
        const box = list.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: list };
        } return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

/* <!---- Styling ----> */
/* I'll keep this in for now to track; for reference, list gets highlighted for as long as the cursor is within it, and focus locks inputs when editing, which is what it should do implicitly in the first place. */

/* <!---- Board Interaction ----> */
function handleBoardDblClick(e) {
    const titleDisplay = e.target.closest(".list-title-display");
    if (!titleDisplay) { return; }
    
    const listElement = titleDisplay.closest(".list");
    if (!listElement) { return; }
    
    listElement.classList.toggle("is-editing");
    if (listElement.classList.contains("is-editing")) {
        const titleInput = listElement.querySelector(".list-title-input");
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }
    }
}


function handleBoardKeyDown(e) {
    const titleInput = e.target.closest(".list-title-input");
    if (!titleInput) { return; }
    if (e.key === "Enter") {
        e.preventDefault();
        commitListTitle(titleInput.dataset.listId, titleInput.value);
    }
    if (e.key === "Escape") {
        e.preventDefault();
        renderBoard();
    } // Hardly Used
}

function handleBoardFocusOut(e) {
    const titleInput = e.target.closest(".list-title-input");
    if (!titleInput) { return; }
    commitListTitle(titleInput.dataset.listId, titleInput.value);
}

function commitListTitle(listId, nextValue) {
    const list = state.lists.find(item => item.id === listId);
    if (!list) { return; }
    const nextTitle = nextValue.trim();
    if (nextTitle) {
        list.title = nextTitle;
        saveState();
    } renderBoard();
}

init();
