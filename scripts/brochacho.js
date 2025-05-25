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

function darkModeToggle() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  const isDarkMode = body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode ? 'dark' : 'light');
  updateDarkModeButton(isDarkMode);
}

initializeDarkMode();

// Form submission
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

  const task = { description, urgency, importance, deadline, subtasks: [] };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// Subtask element creation
function createSubtaskElement(text, taskId) {
  const subtaskItem = document.createElement('li');
  subtaskItem.className = 'list-group-item py-1 d-flex justify-content-between';
  subtaskItem.innerHTML = `
    <span>${text}</span>
    <button class="btn btn-sm btn-outline-danger delete-subtask">
      <i class="bi bi-x"></i>
    </button>
  `;

  subtaskItem.querySelector('.delete-subtask').addEventListener('click', async (e) => {
    e.stopPropagation();
    const item = e.target.closest('li');
    const text = item.querySelector('span').textContent;
    
    // Optimistic UI update
    item.remove();
    
    try {
      // First fetch the current task data
      const taskResponse = await fetch(`${API_URL}/${taskId}`);
      const task = await taskResponse.json();
      
      // Update the subtasks array
      const updatedSubtasks = task.subtasks.filter(s => s !== text);
      
      // Send PATCH request to update the task
      const updateResponse = await fetch(`${API_URL}/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });

      if (!updateResponse.ok) throw new Error('Failed to update subtasks in database');
    } catch (error) {
      console.error("Error deleting subtask:", error);
      // Revert UI if API fails
      const taskItem = document.querySelector(`[data-id="${taskId}"]`);
      if (taskItem) {
        taskItem.querySelector('.subtask-list').appendChild(item);
      }
      alert("Failed to delete subtask. Please try again.");
    }
  });

  return subtaskItem;
}

// Add task to UI
function addTaskToUI(task) {
  const taskItem = document.createElement('li');
  taskItem.className = 'list-group-item elem';
  taskItem.dataset.id = task.id;

  taskItem.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div class="flex-grow-1 me-3">
        <strong>${task.description}</strong>
        <br><small class="text-muted">(Deadline: ${task.deadline})</small>
      </div>
      <div>
        <button class="btn btn-sm btn-outline-info expand-task me-2">
          <i class="bi bi-chevron-down"></i>
        </button>
        <button class="btn btn-sm btn-outline-primary edit-task me-2">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-task">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
    <div class="subtask-container mt-2" style="display: none;">
      <ul class="list-group subtask-list mb-2"></ul>
      <div class="input-group">
        <input type="text" class="form-control subtask-input" placeholder="New subtask">
        <button class="btn btn-primary add-subtask">Add</button>
      </div>
    </div>
  `;

  // Initialize subtasks
  const subtaskList = taskItem.querySelector('.subtask-list');
  (task.subtasks || []).forEach(subtask => {
    subtaskList.appendChild(createSubtaskElement(subtask, task.id));
  });

  // Expand/collapse toggle
  taskItem.querySelector('.expand-task').addEventListener('click', (e) => {
    e.stopPropagation();
    const container = taskItem.querySelector('.subtask-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
    const icon = taskItem.querySelector('.expand-task i');
    icon.classList.toggle('bi-chevron-up');
    icon.classList.toggle('bi-chevron-down');
  });

  // Add subtask
  taskItem.querySelector('.add-subtask').addEventListener('click', async () => {
    const input = taskItem.querySelector('.subtask-input');
    const text = input.value.trim();
    if (!text) return;

    subtaskList.appendChild(createSubtaskElement(text, task.id));
    input.value = '';
    
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push(text);
    await updateTaskInDB(task);
  });

  // Edit task
  taskItem.querySelector('.edit-task').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(task);
  });

  // Delete task
  taskItem.querySelector('.delete-task').addEventListener('click', (e) => {
    e.stopPropagation();
    taskToDelete = task;
    new bootstrap.Modal(document.getElementById('deleteConfirmationModal')).show();
  });

  // Append to correct quadrant
  let targetListId;
  if (task.urgency === 'urgent' && task.importance === 'important') targetListId = 'do';
  else if (task.urgency === 'not-urgent' && task.importance === 'important') targetListId = 'decide';
  else if (task.urgency === 'urgent' && task.importance === 'not-important') targetListId = 'delegate';
  else targetListId = 'delete';

  document.getElementById(targetListId).appendChild(taskItem);
}

// Update task in DB
async function updateTaskInDB(updatedTask) {
  try {
    const response = await fetch(`${API_URL}/${updatedTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    });
    return response.ok;
  } catch (error) {
    console.error("Error updating task:", error);
    return false;
  }
}

// Delete task confirmation
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!taskToDelete) return;

  try {
    const response = await fetch(`${API_URL}/${taskToDelete.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete task');
    document.querySelector(`li[data-id="${taskToDelete.id}"]`).remove();
    bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal')).hide();
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Failed to delete task. Please try again.");
  } finally {
    taskToDelete = null;
  }
});

// Load tasks
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

// Edit task form
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
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Error updating task.');
  }
});

// Initialize
loadTasks();