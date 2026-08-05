const projectsButton = document.getElementById("projects-button");
if (projectsButton) {
  projectsButton.addEventListener("click", function() {
    window.location.href = "projects.html";
  });
}

function applyExperienceFilter(filter) {
  const filterButtons = document.querySelectorAll(".filter-button");
  const experienceCards = document.querySelectorAll(".experience-card");

  if (!experienceCards.length) {
    return;
  }

  filterButtons.forEach(function(btn) {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  experienceCards.forEach(function(card) {
    if (filter === "all" || card.dataset.category === filter) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}

const filterButtons = document.querySelectorAll(".filter-button");
if (filterButtons.length) {
  filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      applyExperienceFilter(button.dataset.filter);
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const initialFilter = urlParams.get("filter") || "all";
  applyExperienceFilter(initialFilter);
}

if (filterButtons.length && experienceCards.length) {
  filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      filterButtons.forEach(function(btn) {
        btn.classList.remove("active");
      });
      button.classList.add("active");

      const filter = button.dataset.filter;
      experienceCards.forEach(function(card) {
        if (filter === "all" || card.dataset.category === filter) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}


