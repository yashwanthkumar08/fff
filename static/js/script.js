document.addEventListener("DOMContentLoaded", function () {
    // Existing variables
    const addbtn = document.getElementById("add-button");
    const noteFormModal = document.getElementById("note-form");
    const addNoteForm = document.getElementById("add-note-form");
    const closeBtn = document.querySelector(".close");
    const titleInput = document.getElementById("note-title");
    const descriptionInput = document.getElementById("note-description");
    const categoryInput = document.getElementById("note-category");
    const modalTitle = document.getElementById("modal-title");
    const submitButton = document.getElementById("submit-button");
    const searchInput = document.getElementById("search-input");
    const showCompletedCheckbox = document.getElementById("show-completed");
    const notesContainer = document.querySelector(".notes");
    const colors = ['#d64f6f', '#be6a0a', '#4d61c0', '#36b4a6', '#cc5dbc', '#d49d29'];
    let editingNoteId = null; // Variable to track the note being edited
    const categoryItems = document.querySelectorAll('.categories li');

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const filterValue = item.getAttribute('data-filter');
            filterNotes(filterValue);
        });
    });

    function filterNotes(category) {
        const notes = document.querySelectorAll(".input-box");
        notes.forEach(note => {
            const noteCategory = note.querySelector('.note-category').innerText.toLowerCase();
            // Check if the selected category is 'all' or matches the note's category
            if (category === 'all' || noteCategory === category) {
                note.style.display = 'block'; // Show the note
            } else {
                note.style.display = 'none'; // Hide the note
            }
        });

        // Update active category style
        updateActiveCategory(category);
    }

    function updateActiveCategory(selectedCategory) {
        categoryItems.forEach(item => {
            // Remove active class from all category items
            item.classList.remove('active');
            // Add active class to the selected category
            if (item.getAttribute('data-filter') === selectedCategory) {
                item.classList.add('active');
            }
        });
    }

    // Event listener for adding a new note
    addbtn.addEventListener('click', () => {
        titleInput.value = '';
        descriptionInput.value = '';
        categoryInput.value = 'business';
        modalTitle.textContent = "Add New Note";
        submitButton.textContent = "Add Note";
        editingNoteId = null; 
        noteFormModal.style.display = "block"; // Show the form
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        noteFormModal.style.display = "none"; 
        editingNoteId = null; // Close the form
    });

    window.addEventListener('click', (event) => {
        if (event.target == noteFormModal) {
            noteFormModal.style.display = "none"; // Close the form if clicking outside the modal
        }
    });

    // Submit new note or update existing note
    addNoteForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        // Storing user inputs into different variables
        const noteTitle = titleInput.value;
        const noteDescription = descriptionInput.value.replace(/\n/g, '<br>');
        const noteCategory = categoryInput.value;
        const completed = document.querySelector('#completed-checkbox')?.checked || false;
        const noteColor = colors[Math.floor(Math.random() * colors.length)];

        if (editingNoteId) {
            // Update existing note
            fetch(`/update_note/${editingNoteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'title': noteTitle,
                    'description': noteDescription,
                    'category': noteCategory,
                    'completed': completed,
                    'color': noteColor
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json(); // Parse the JSON response
                } else {
                    console.error('Update failed:', response.status);
                    alert('Failed to update the note.'); // Notify the user
                }
            })
            .then(updatedNote => {
                // Update the note in the DOM without refreshing
                const inputBox = notesContainer.querySelector(`[data-id="${updatedNote.id}"]`);
                if (inputBox) {
                    inputBox.querySelector('.note-title').innerText = updatedNote.title;
                    inputBox.querySelector('.note-description').innerHTML = updatedNote.description;
                    inputBox.querySelector('.note-category').innerText = updatedNote.category;
                    inputBox.querySelector('.note-completed').checked = updatedNote.completed;
                    inputBox.style.backgroundColor = updatedNote.color;
                } else {
                    console.error('Note not found in the DOM');
                }

                // Reset editingNoteId and close the modal
                noteFormModal.style.display = "none"; // Close the modal
                editingNoteId = null;
            })
            .catch(error => console.error('Error:', error));
        } else {
            // Add a new note
            fetch('/add_note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: noteTitle,
                    description: noteDescription,
                    category: noteCategory,
                    completed: false,
                    color: noteColor
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json(); // Get the JSON response
                } else {
                    console.error('Failed to add note:', response.status);
                    alert('Failed to add note.'); // Notify the user
                }
            })
            .then(newNote => {
                const note = {
                    id: newNote.id, // Get ID from response
                    name: noteTitle,
                    description: noteDescription,
                    timestamp: newNote.timestamp, // or use newNote.timestamp if you get it from the server
                    category: noteCategory,
                    completed: false,
                    color: noteColor
                };
                createNoteElement(note); // Call your function to create a new note element
                noteFormModal.style.display = "none"; // Close the modal
            })
            .catch(error => console.error('Error:', error));
        }
    
        // Reset the editing note ID
        editingNoteId = null;
    });

    // Search functionality
    searchInput.addEventListener("keyup", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const notes = document.querySelectorAll(".input-box");

        notes.forEach(note => {
            const title = note.querySelector(".note-title").innerText.toLowerCase();   
            const description = note.querySelector(".note-description").innerText.toLowerCase();  

            if (title.includes(searchTerm) || description.includes(searchTerm)) {   
                note.style.display = "block"; // Show matching note
            } else {
                note.style.display = "none"; // Hide non-matching note
            }
        });
    });

    // Attach event listeners for edit and delete buttons
    notesContainer.addEventListener('click', (e) => {
        const inputBox = e.target.closest('.input-box');
        if (!inputBox) return;
        const noteId = inputBox.getAttribute('data-id');

        if (e.target.closest('.delete-button') || e.target.classList.contains('delete')) {
            deleteNoteById(noteId, inputBox);
        } else if (e.target.closest('.edit-button') || e.target.classList.contains('edit')) {
            editNoteById(noteId, inputBox);
        }
    });

    function deleteNoteById(id, inputBox) {
        fetch(`/delete_note/${id}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    inputBox.remove(); // Remove the note from the DOM
                } else {
                    console.error('Delete failed:', response.status);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function editNoteById(id, inputBox) {
        if (!inputBox) return;
        editingNoteId = id; // Store the ID of the note being edited
        const title = inputBox.querySelector('.note-title').innerText;
        const description = inputBox.querySelector('.note-description').innerHTML.replace(/<br>/g, '\n');
        const category = inputBox.querySelector('.note-category').innerText;
        const isCompleted = inputBox.querySelector('.note-completed').checked;

        // Set values in the modal
        titleInput.value = title;
        descriptionInput.value = description;
        categoryInput.value = category;
        document.querySelector('#completed-checkbox').checked = isCompleted;

        modalTitle.textContent = "Edit Note";
        submitButton.textContent = "Save Changes";
        noteFormModal.style.display = "block"; // Show the modal
    }

    function createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'input-box';
        noteElement.setAttribute('data-id', note.id);
        noteElement.style.backgroundColor = note.color;  // Apply the note's color
        
        noteElement.innerHTML = `
            <div class="note-title">${note.name}</div>
            <div class="note-description">${note.description}</div>
            <div class="note-category">${note.category}</div>
            <input type="checkbox" class="note-completed" ${note.completed ? 'checked' : ''} />
            <button class="delete-button">
                <img src="/static/images/delete_button.png" alt="delete icon" class="delete">
            </button>
            <button class="edit-button">
                <img src="/static/images/edit_button.png" alt="edit icon" class="edit">
            </button>
        `;

        notesContainer.appendChild(noteElement); // Append the note to the container
    }
});
