const form = document.getElementById('taskForm');
const descriptionInput = document.getElementById('description');
const urgencySelect = document.getElementById('urgency');
const importanceSelect = document.getElementById('importance');
const deadlineInput = document.getElementById('deadline');
const user = "admin";

const API_URL = "http://localhost:3000/tasks"; // json-server endpoint


function initializeDarkMode() {
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedMode = localStorage.getItem('darkMode');
  
  if (savedMode === 'dark' || (savedMode === null && prefersDarkScheme)) {
    document.body.classList.add('dark-mode');
    updateDarkModeButton(true);
  } else {
    updateDarkModeButton(false);
  }
}

function updateDarkModeButton(isDarkMode) {
  const darkModeBtn = document.querySelector('.dark-mode-toggle');
  if (isDarkMode) {
    darkModeBtn.innerHTML = '<i class="bi bi-sun-fill"></i> Toggle Light Mode';
    darkModeBtn.classList.remove('btn-dark');
    darkModeBtn.classList.add('btn-light');
  } else {
    darkModeBtn.innerHTML = '<i class="bi bi-moon-fill"></i> Toggle Dark Mode';
    darkModeBtn.classList.remove('btn-light');
    darkModeBtn.classList.add('btn-dark');
  }
}

function darkModeToggle() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  
  const isDarkMode = body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode ? 'dark' : 'light');
  
  updateDarkModeButton(isDarkMode);
}

initializeDarkMode();



form.addEventListener('submit', async function(event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const urgency = urgencySelect.value;
  const importance = importanceSelect.value;
  const deadline = deadlineInput.value;

  if (!description || !urgency || !importance || !deadline) {
    alert('Please fill out all fields!');
    return;
  }

  const task = { description, urgency, importance, deadline };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(task)
    });

    if (!response.ok) throw new Error("Failed to save task");

    const savedTask = await response.json();
    addTaskToUI(savedTask);
    form.reset();

  } catch (error) {
    console.error(error);
    alert('Error saving task.');
  }
});

let taskToDelete = null;

function addTaskToUI(task) {
  const taskItem = document.createElement('li');
  taskItem.className = 'list-group-item d-flex justify-content-between align-items-center';
  taskItem.dataset.id = task.id;

  taskItem.innerHTML = `
    <div class="flex-grow-1 me-3">
      <strong>${task.description}</strong> 
      <br><small class="text-muted">(Deadline: ${task.deadline})</small>
    </div>
    <button class="btn btn-sm btn-outline-danger delete-task">
      <i class="bi bi-trash"></i>
    </button>
  `;

  taskItem.addEventListener('click', () => openEditModal(task));

  // Append to the correct list based on task urgency and importance
  let targetListId;
  if (task.urgency === 'urgent' && task.importance === 'important') targetListId = 'do';
  else if (task.urgency === 'not-urgent' && task.importance === 'important') targetListId = 'decide';
  else if (task.urgency === 'urgent' && task.importance === 'not-important') targetListId = 'delegate';
  else targetListId = 'delete';

  const list = document.getElementById(targetListId);
  list.appendChild(taskItem);

  // Attach delete event
  taskItem.querySelector('.delete-task').addEventListener('click', async (e) => {
    e.stopPropagation(); // Prevent triggering the modal if you're also using click-to-edit

    // Store the task to be deleted
    taskToDelete = task;
    
    // Show the confirmation modal
    const deleteConfirmationModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    deleteConfirmationModal.show();
  });
}

// Handle the confirm delete action
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!taskToDelete) return;

  try {
    // Delete the task from the backend (json-server)
    await fetch(`${API_URL}/${taskToDelete.id}`, { method: 'DELETE' });

    // Remove the task from the UI
    const taskItem = document.querySelector(`[data-id="${taskToDelete.id}"]`);
    if (taskItem) taskItem.remove();

    // Close the confirmation modal
    const deleteConfirmationModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
    deleteConfirmationModal.hide();
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Failed to delete task.");
  }

  // Reset taskToDelete variable
  taskToDelete = null;
});

async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    tasks.forEach(addTaskToUI);
  } catch (error) {
    console.error(error);
  }
}

loadTasks();

function openEditModal(task) {
  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editDescription').value = task.description;
  document.getElementById('editUrgency').value = task.urgency;
  document.getElementById('editImportance').value = task.importance;
  document.getElementById('editDeadline').value = task.deadline;

  const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
  modal.show();
}

document.getElementById('editTaskForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('editTaskId').value;
  const description = document.getElementById('editDescription').value.trim();
  const urgency = document.getElementById('editUrgency').value;
  const importance = document.getElementById('editImportance').value;
  const deadline = document.getElementById('editDeadline').value;

  const updatedTask = { description, urgency, importance, deadline };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    });

    if (!response.ok) throw new Error('Failed to update task');

    location.reload(); // reload to refresh UI

  } catch (err) {
    console.error(err);
    alert('Error updating task.');
  }
});