# General Requirements
    - Use Vanilla HTML, no frameworks
    - Use event listeners properly
    - Use event delegation for dynamic items
    - Persistent data via localStorage
    - Keep code readable
        - Separate concerns: state, render(), and handlers
        - Store data as arrays/objects, not raw HTML strings

# Kanban Board Requirements
    - Allow the ability to create, edit, and delete task cards.
        - Remove the hardcoded task cards.
        - Optionally, add a category capability to each task
    - Persistence to localStorage: save which cards and lists exist at all times
    - Allow a Search/Filter option that hides other tasks

# QnA
### General Questions
- Usage of frameworks?
    - No frameworks used
- Usage of Event Listeners?
    - Navigation Bar and the Board Div have the initial event listeners. The child elements will also get event listeners
    - Related: `init()`
- Usage of Event Delegation?
    - List buttons are done through event delegation. The targets and actions are all defined in a click event attached to the Board Div (Parent element of list).
    - Related: `handleBoardClick()`
- Data Persistence?
    - Everytime a List, Card, or Category is modified, it is saved to localStorage under the key 'kanbanBoardState'.
    - There are two objects stored: lists and categories, with lists having a card object as one of its properties.
    - Lists are updated every time a card is moved, added, or deleted. While categories are only updated when a category is added or deleted.
    - IDs are generated with the pattern: {Name}-{Base36 randomizer, (0-9, a-z; without '0.')}-{Timestamp}
    - localStorage is only loaded on initialization, else it's all input.
    - Related: `saveState()` `syncStateFromDOM()` `loadState()`
- Code Organization?
    - State management is separated from rendering and event handling.
    - Data is stored as objects (i.e Lists having properties), not HTML strings.
    - SaveStates and LoadStates are their own functions. Rendering is its own function. And handlers are its own functions, they don't clash responsibilities.
    - Related `const state = loadState()` `renderBoard()` `handleBoardClick()`

### Kanban Board Questions
- Mutable Task Cards?
    - Cards have dedicated screens for when it's created or edited. When either of those are clicked, a toggle to be on editing mode is activated, replacing the current card to a form card. Based on the actions in the editing screen, the card will be saved via the list localStorage.
    - Related `createCardElement(card, listId)` `handleBoardSubmit()` `let uiState = { [Properties] }`
- Optional Category System?
    - NavBar handles the creation and deletion of categories. Deleting synchronizes with the cards, re-renders the board and navigation dropdowns, clearing the non-existing categories.
    - In the card form (Edit mode), categories are selectable from a dropdown.
    - Related `handleCreateCategory()` `handleDeleteCategory()` `handleCategoryFilter()` `renderCategoryControls()` `renderProjectControls()`
- localStorage Persistence?
    - Mentioned in General Questions
    - Related `saveState()` `syncStateFromDOM()` `loadState()`
- Search Feature?
    - Filters via text input. Searches through list titles, card titles, and category names (tags).
    - Changes the filterText property in uiState, turning the isFilterActive function to true. It then re-renders via renderBoard() which initially checks the isFilterActive function.
    - Related `attachSearchHandler()` `isFilterActive()` `renderBoard()` `let uiState = { [Properties] }`

