const form = document.getElementById('taskForm');
const descriptionInput = document.getElementById('description');
const urgencySelect = document.getElementById('urgency');
const importanceSelect = document.getElementById('importance');
const deadlineInput = document.getElementById('deadline');
const user = "admin";

const API_URL = "http://localhost:3000/tasks"; // json-server endpoint

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

function addTaskToUI(task) {
  const taskItem = document.createElement('li');
  taskItem.className = 'list-group-item d-flex justify-content-between align-items-center';
  taskItem.innerHTML = `
    <div>
      <strong>${task.description}</strong> 
      <small class="text-muted">(Deadline: ${task.deadline})</small>
    </div>
  `;

  if (task.urgency === 'urgent' && task.importance === 'important') {
    document.getElementById('do').appendChild(taskItem);
  } else if (task.urgency === 'not-urgent' && task.importance === 'important') {
    document.getElementById('decide').appendChild(taskItem);
  } else if (task.urgency === 'urgent' && task.importance === 'not-important') {
    document.getElementById('delegate').appendChild(taskItem);
  } else if (task.urgency === 'not-urgent' && task.importance === 'not-important') {
    document.getElementById('delete').appendChild(taskItem);
  }
}

// Load existing tasks on page load
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
