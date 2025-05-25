const form = document.getElementById('destinationForm');
const countryInput = document.getElementById('country');
const destinationsList = document.getElementById('destinationsList');

const API_URL = "http://localhost:3000/destinations";

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

  const country = countryInput.value.trim();

  if (!country) {
    alert('Please enter a country!');
    return;
  }

  const destination = { country, subtasks: [] };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(destination)
    });

    if (!response.ok) throw new Error("Failed to save destination");
    const savedDestination = await response.json();
    addDestinationToUI(savedDestination);
    form.reset();
  } catch (error) {
    console.error(error);
    alert('Error saving destination.');
  }
});

let destinationToDelete = null;

// Create preparation element
function createPreparationElement(prep, destinationId) {
  const preparationItem = document.createElement('li');
  preparationItem.className = 'preparation-item';
  if (prep.completed) {
    preparationItem.classList.add('completed');
  }

  preparationItem.innerHTML = `
    <span class="preparation-text">${prep.text}</span>
    <div class="preparation-actions">
      <button class="btn btn-sm btn-outline-success toggle-complete">
        <i class="bi ${prep.completed ? 'bi-check-circle-fill' : 'bi-check-circle'}"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger delete-preparation">
        <i class="bi bi-x"></i>
      </button>
    </div>
  `;

  // Toggle completion
  preparationItem.querySelector('.toggle-complete').addEventListener('click', async (e) => {
    e.stopPropagation();
    const item = e.target.closest('li');
    const prepText = item.querySelector('.preparation-text').textContent;
    
    try {
      // Get current destination data
      const destinationResponse = await fetch(`${API_URL}/${destinationId}`);
      const destination = await destinationResponse.json();
      
      // Update preparation status
      const prepIndex = destination.subtasks.findIndex(s => s.text === prepText);
      if (prepIndex !== -1) {
        destination.subtasks[prepIndex].completed = !destination.subtasks[prepIndex].completed;
        
        // Save to database
        await fetch(`${API_URL}/${destinationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtasks: destination.subtasks })
        });
        
        // Update UI
        item.classList.toggle('completed');
        const icon = item.querySelector('.toggle-complete i');
        icon.classList.toggle('bi-check-circle');
        icon.classList.toggle('bi-check-circle-fill');
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
    }
  });

  // Delete preparation
  preparationItem.querySelector('.delete-preparation').addEventListener('click', async (e) => {
    e.stopPropagation();
    const item = e.target.closest('li');
    const prepText = item.querySelector('.preparation-text').textContent;
    
    try {
      // Get current destination data
      const destinationResponse = await fetch(`${API_URL}/${destinationId}`);
      const destination = await destinationResponse.json();
      
      // Update preparations array
      destination.subtasks = destination.subtasks.filter(s => s.text !== prepText);
      
      // Save to database
      await fetch(`${API_URL}/${destinationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: destination.subtasks })
      });
      
      // Remove from UI
      item.remove();
    } catch (error) {
      console.error("Error deleting preparation:", error);
      alert("Failed to delete preparation. Please try again.");
    }
  });

  return preparationItem;
}

// Add destination to UI
function addDestinationToUI(destination) {
  const destinationItem = document.createElement('li');
  destinationItem.className = 'destination-item mb-3';
  destinationItem.dataset.id = destination.id;

  destinationItem.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div class="flex-grow-1">
        <h5 class="mb-1">${destination.country}</h5>
      </div>
      <div>
        <button class="btn btn-sm btn-outline-info expand-preparation me-2">
          <i class="bi bi-chevron-down"></i>
        </button>
        <button class="btn btn-sm btn-outline-primary edit-destination me-2">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-destination">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
    <div class="preparation-container" style="display: none;">
      <ul class="list-unstyled preparation-list mt-2"></ul>
      <div class="input-group mt-2">
        <input type="text" class="form-control preparation-input" placeholder="Add preparation step">
        <button class="btn btn-outline-secondary add-preparation">Add</button>
      </div>
    </div>
  `;

  // Initialize preparations
  const preparationList = destinationItem.querySelector('.preparation-list');
  (destination.subtasks || []).forEach(prep => {
    preparationList.appendChild(createPreparationElement(prep, destination.id));
  });

  // Expand/collapse toggle
  destinationItem.querySelector('.expand-preparation').addEventListener('click', (e) => {
    e.stopPropagation();
    const container = destinationItem.querySelector('.preparation-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
    const icon = destinationItem.querySelector('.expand-preparation i');
    icon.classList.toggle('bi-chevron-up');
    icon.classList.toggle('bi-chevron-down');
  });

  // Add preparation
  destinationItem.querySelector('.add-preparation').addEventListener('click', async () => {
    const input = destinationItem.querySelector('.preparation-input');
    const text = input.value.trim();
    if (!text) return;

    const newPrep = { text, completed: false };
    preparationList.appendChild(createPreparationElement(newPrep, destination.id));
    input.value = '';
    
    if (!destination.subtasks) destination.subtasks = [];
    destination.subtasks.push(newPrep);
    await fetch(`${API_URL}/${destination.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtasks: destination.subtasks })
    });
  });

  // Edit destination
  destinationItem.querySelector('.edit-destination').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(destination);
  });

  // Delete destination
  destinationItem.querySelector('.delete-destination').addEventListener('click', (e) => {
    e.stopPropagation();
    destinationToDelete = destination;
    new bootstrap.Modal(document.getElementById('deleteConfirmationModal')).show();
  });

  destinationsList.appendChild(destinationItem);
}

// Delete destination confirmation
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!destinationToDelete) return;

  try {
    const response = await fetch(`${API_URL}/${destinationToDelete.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete destination');
    document.querySelector(`li[data-id="${destinationToDelete.id}"]`).remove();
    bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal')).hide();
  } catch (error) {
    console.error("Error deleting destination:", error);
    alert("Failed to delete destination. Please try again.");
  } finally {
    destinationToDelete = null;
  }
});

// Load destinations
async function loadDestinations() {
  try {
    const response = await fetch(API_URL);
    const destinations = await response.json();
    destinations.forEach(addDestinationToUI);
  } catch (error) {
    console.error(error);
  }
}

// Open edit modal
function openEditModal(destination) {
  document.getElementById('editDestinationId').value = destination.id;
  document.getElementById('editCountry').value = destination.country;
  new bootstrap.Modal(document.getElementById('editDestinationModal')).show();
}

// Edit destination form
document.getElementById('editDestinationForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('editDestinationId').value;
  const updatedDestination = {
    country: document.getElementById('editCountry').value.trim()
  };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDestination)
    });

    if (!response.ok) throw new Error('Failed to update destination');
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Error updating destination.');
  }
});

// Initialize
loadDestinations();