const form = document.getElementById('taskForm');
const descriptionInput = document.getElementById('description');
const urgencySelect = document.getElementById('urgency');
const importanceSelect = document.getElementById('importance');
const deadlineInput = document.getElementById('deadline');
const user = "admin";

const API_URL = "http://localhost:3000/tasks";

// Initialize dark mode
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

// Update dark mode button style
function updateDarkModeButton(isDarkMode) {
  const darkModeBtn = document.querySelector('.dark-mode-toggle');
  if (isDarkMode) {
    darkModeBtn.classList.remove('btn-dark');
    darkModeBtn.classList.add('btn-light');
  } else {
    darkModeBtn.classList.remove('btn-light');
    darkModeBtn.classList.add('btn-dark');
  }
}

// Toggle dark mode
function darkModeToggle() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  const isDarkMode = body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode ? 'dark' : 'light');
  updateDarkModeButton(isDarkMode);
}

// Initialize dark mode on load
initializeDarkMode();

// Handle form submission
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

// Add task to UI
function addTaskToUI(task) {
  const taskItem = document.createElement('li');
  taskItem.className = 'list-group-item d-flex justify-content-between align-items-center elem';
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

  // Append to the correct quadrant
  let targetListId;
  if (task.urgency === 'urgent' && task.importance === 'important') targetListId = 'do';
  else if (task.urgency === 'not-urgent' && task.importance === 'important') targetListId = 'decide';
  else if (task.urgency === 'urgent' && task.importance === 'not-important') targetListId = 'delegate';
  else targetListId = 'delete';

  document.getElementById(targetListId).appendChild(taskItem);

  // Attach delete handler
  taskItem.querySelector('.delete-task').addEventListener('click', (e) => {
    e.stopPropagation();
    taskToDelete = task;
    new bootstrap.Modal(document.getElementById('deleteConfirmationModal')).show();
  });
}

// Delete task handler
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!taskToDelete) return;

  try {
    await fetch(`${API_URL}/${taskToDelete.id}`, { method: 'DELETE' });
    document.querySelector(`[data-id="${taskToDelete.id}"]`).remove();
    bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal')).hide();
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Failed to delete task.");
  }
  taskToDelete = null;
});

// Load tasks from db.json
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    tasks.forEach(addTaskToUI);
  } catch (error) {
    console.error(error);
  }
}

// Open edit modal
function openEditModal(task) {
  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editDescription').value = task.description;
  document.getElementById('editUrgency').value = task.urgency;
  document.getElementById('editImportance').value = task.importance;
  document.getElementById('editDeadline').value = task.deadline;
  new bootstrap.Modal(document.getElementById('editTaskModal')).show();
}

// Handle edit form submission
document.getElementById('editTaskForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('editTaskId').value;
  const updatedTask = {
    description: document.getElementById('editDescription').value.trim(),
    urgency: document.getElementById('editUrgency').value,
    importance: document.getElementById('editImportance').value,
    deadline: document.getElementById('editDeadline').value
  };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    });

    if (!response.ok) throw new Error('Failed to update task');
    location.reload(); // Refresh to show changes
  } catch (err) {
    console.error(err);
    alert('Error updating task.');
  }
});

// Initialize the app
loadTasks();