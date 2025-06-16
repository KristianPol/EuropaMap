const form = document.getElementById('destinationForm');
const countryInput = document.getElementById('country');
const destinationsList = document.getElementById('destinationsList');

const API_URL = "http://localhost:3000/destinations";

// Initialize dark mode
function initializeDarkMode() {
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedMode = localStorage.getItem('darkMode');
  const isDark = savedMode === 'dark' || (savedMode === null && prefersDarkScheme);

  // Toggle dark mode on the body only (remove document.documentElement)
  if (isDark) {
    document.body.classList.add('dark-mode');
    updateDarkModeButton(true);
  } else {
    document.body.classList.remove('dark-mode');
    updateDarkModeButton(false);
  }
}

function updateDarkModeButton(isDarkMode) {
  const darkModeBtn = document.querySelector('.dark-mode-toggle');
  if (!darkModeBtn) return;
  
  // Update button appearance
  if (isDarkMode) {
    darkModeBtn.innerHTML = '<i class="bi bi-sun-fill"></i>'; // Sun icon for dark mode
    darkModeBtn.classList.remove('btn-dark');
    darkModeBtn.classList.add('btn-light');
  } else {
    darkModeBtn.innerHTML = '<i class="bi bi-moon-fill"></i>'; // Moon icon for light mode
    darkModeBtn.classList.remove('btn-light');
    darkModeBtn.classList.add('btn-dark');
  }
}

// Add this function to toggle dark mode
function darkModeToggle() {
  const isDark = document.body.classList.contains('dark-mode');
  document.body.classList.toggle('dark-mode');
  
  // Save preference to localStorage
  localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
  
  // Update button
  updateDarkModeButton(!isDark);
}

// Initialize dark mode when page loads
document.addEventListener('DOMContentLoaded', initializeDarkMode);

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
  const budget = document.getElementById('budget').value.trim();

  if (!country || !budget) {
    alert('Please enter both country and budget!');
    return;
  }

  const destination = { 
    country, 
    budget: parseFloat(budget), // Convert to number
    preparations: [] 
  };

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
  const item = document.createElement('li');
  item.className = `preparation-item ${prep.completed ? 'completed' : ''}`;
  
  item.innerHTML = `
    <div class="container-fluid d-flex justify-content-between align-items-center">
      <div>
        <span class="preparation-text">${prep.text}</span>
        <span class="badge bg-primary ms-2">€${prep.cost?.toFixed(2) || '0.00'}</span>
      </div>
      <div class="preparation-actions d-flex">
        <button class="btn btn-sm btn-outline-success toggle-complete">
          <i class="bi ${prep.completed ? 'bi-check-circle-fill' : 'bi-check-circle'}"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-preparation">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  `;

  // Toggle completion
  item.querySelector('.toggle-complete').addEventListener('click', async function(e) {
    e.stopPropagation();
    const prepItem = e.target.closest('.preparation-item');
    
    try {
      const response = await fetch(`${API_URL}/${destinationId}`);
      const destination = await response.json();
      
      const prepIndex = destination.preparations.findIndex(p => p.text === prep.text);
      if (prepIndex >= 0) {
        destination.preparations[prepIndex].completed = !destination.preparations[prepIndex].completed;
        
        await fetch(`${API_URL}/${destinationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preparations: destination.preparations })
        });

        prepItem.classList.toggle('completed');
        const icon = this.querySelector('i');
        icon.classList.toggle('bi-check-circle');
        icon.classList.toggle('bi-check-circle-fill');
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
    }
  });

  // Delete preparation
  item.querySelector('.delete-preparation').addEventListener('click', async function(e) {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_URL}/${destinationId}`);
      const destination = await response.json();
      
      destination.preparations = destination.preparations.filter(p => p.text !== prep.text);
      
      await fetch(`${API_URL}/${destinationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preparations: destination.preparations })
      });

      console.log(item.parentElement.parentElement.parentElement);
      item.querySelector(".badge").innerHTML=0;
      updateCostTotal(item.parentElement.parentElement.parentElement);
      item.remove();

      //item.remove();
    } catch (error) {
      console.error("Error deleting preparation:", error);
    }
  });

  return item;
}

function updateCostTotal(destinationItem) {
  const preparations = destinationItem.querySelectorAll('.preparation-item');
  let totalSpent = 0;
  
  preparations.forEach(prep => {
    const costBadge = prep.querySelector('.badge');
    if (costBadge) {
      const cost = parseFloat(costBadge.textContent.replace('€', '')) || 0;
      totalSpent += cost;
    }
  });

  const budgetText = destinationItem.querySelector('small.text-muted')?.textContent;
  const totalBudget = budgetText ? parseFloat(budgetText.match(/[\d,.]+/)[0]) : 0;
  const remaining = totalBudget - totalSpent;

  const remainingElement = destinationItem.querySelector('.remaining-budget');
  if (remainingElement) {
    remainingElement.textContent = remaining.toFixed(2);
    
    // Update styling based on remaining amount
    remainingElement.classList.toggle('text-danger', remaining < 0);
    remainingElement.classList.toggle('text-success', remaining >= 0);
    
    // Optional: Add warning icon when over budget
    if (remaining < 0) {
      remainingElement.innerHTML = `${remaining.toFixed(2)} <i class="bi bi-exclamation-triangle-fill ms-1"></i>`;
    }
  }
}

function calculateBudgetStats(destination) {
  // Safely extract values with defaults
  const budget = Number(destination?.budget) || 0;
  const preparations = destination?.preparations || destination?.subtasks || [];
  
  // Calculate totals
  const totalSpent = preparations.reduce((sum, prep) => {
    return sum + (Number(prep?.cost) || (Number(prep?.amount) || 0));
  }, 0);
  
  const remaining = budget - totalSpent;
  const percentageUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

  return remaining;
}

// Add destination to UI
function addDestinationToUI(destination) {
  // Validate destination object
  if (!destination || typeof destination !== 'object') {
    console.error('Invalid destination data:', destination);
    return;
  }

  const destinationItem = document.createElement('li');
  destinationItem.className = 'destination-item mb-3';
  destinationItem.dataset.id = destination.id;

  // Safely handle missing budget
  const budget = destination.budget || 0;
  const budgetDisplay = typeof budget.toLocaleString === 'function' 
    ? budget.toLocaleString() 
    : budget.toString();

  destinationItem.innerHTML = `
    <div class="destination-header">
      <div>
        <h5 class="mb-0">${destination.country || 'Unnamed Destination'}</h5>
        <div class="d-flex gap-3 align-items-center">
          <small class="text-muted">Budget: €${destination.budget.toFixed(2)}</small>
          <small class="text-muted">Remaining: €${calculateBudgetStats(destination)>=0 
            ? `<span class="remaining-budget text-success">${calculateBudgetStats(destination).toFixed(2)} </span></small>`
            : `<span class="remaining-budget text-danger">${calculateBudgetStats(destination).toFixed(2)} <i class="bi bi-exclamation-triangle-fill ms-1"></i></span></small>` }
        </div>
      </div>
      <div class="destination-actions">
        <button class="btn btn-sm btn-outline-info expand-preparation">
          <i class="bi bi-chevron-down"></i>
        </button>
        <button class="btn btn-sm btn-outline-primary edit-destination">
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
        <input type="text" class="form-control preparation-input" placeholder="Enter plans/expenses">
        <input type="number" class="form-control cost-input" placeholder="Cost (€)" min="0" step="10">
        <button class="btn btn-outline-secondary add-preparation">Add</button>
      </div>
    </div>
  `;

  // Initialize preparations
  const preparationList = destinationItem.querySelector('.preparation-list');
  (destination.preparations || []).forEach(prep => {
    preparationList.appendChild(createPreparationElement(prep, destination.id));
  });

  // Expand/collapse toggle
  destinationItem.querySelector('.expand-preparation').addEventListener('click', (e) => {
    e.stopPropagation();
    const container = destinationItem.querySelector('.preparation-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
    
    // Update costs whenever the container is opened
    if (container.style.display === 'block') {
      updateCostTotal(destinationItem);
    }
    
    const icon = e.currentTarget.querySelector('i');
    icon.classList.toggle('bi-chevron-up');
    icon.classList.toggle('bi-chevron-down');
  });

  // Add preparation
  destinationItem.querySelector('.add-preparation').addEventListener('click', async () => {
  const input = destinationItem.querySelector('.preparation-input');
  const costInput = destinationItem.querySelector('.cost-input');
  const text = input.value.trim();
  const cost = parseFloat(costInput.value) || 0;

  if (!text) {
    alert('Please enter a preparation description!');
    return;
  }

  const newPreparation = { 
    text, 
    cost,
    completed: false 
  };

  try {
    // Add to UI
    const prepElement = createPreparationElement(newPreparation, destination.id);
    destinationItem.querySelector('.preparation-list').appendChild(prepElement);
    
    // Add to database
    const destinationResponse = await fetch(`${API_URL}/${destination.id}`);
    const destinationData = await destinationResponse.json();
    destinationData.preparations = destinationData.preparations || [];
    destinationData.preparations.push(newPreparation);
    
    await fetch(`${API_URL}/${destination.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preparations: destinationData.preparations })
    });
    
    // Reset inputs and update totals
    input.value = '';
    costInput.value = '';
    updateCostTotal(destinationItem);
  } catch (error) {
    console.error("Error adding preparation:", error);
  }
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const destinations = await response.json();
    
    // Clear existing list
    destinationsList.innerHTML = '';
    
    // Validate and load each destination
    if (Array.isArray(destinations)) {
      destinations.forEach(destination => {
        try {
          if (destination && destination.id) {
            addDestinationToUI(destination);
          } else {
            console.warn('Skipping invalid destination:', destination);
          }
        } catch (error) {
          console.error('Error rendering destination:', error);
        }
      });
    } else {
      console.error('Received invalid destinations data:', destinations);
    }
  } catch (error) {
    console.error('Failed to load destinations:', error);
    // Optional: Show user-friendly error message
    destinationsList.innerHTML = `
      <li class="text-danger p-3">
        Failed to load destinations. Please try again later.
      </li>
    `;
  }
}

// Open edit modal
function openEditModal(destination) {
  document.getElementById('editDestinationId').value = destination.id;
  document.getElementById('editCountry').value = destination.country;
  document.getElementById('editBudget').value = destination.budget;
  new bootstrap.Modal(document.getElementById('editDestinationModal')).show();
}

// Edit destination form
document.getElementById('editDestinationForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('editDestinationId').value;
  const updatedDestination = {
    country: document.getElementById('editCountry').value.trim(),
    budget: parseFloat(document.getElementById('editBudget').value.trim())
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