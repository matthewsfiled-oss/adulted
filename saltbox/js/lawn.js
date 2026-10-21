const form = document.getElementById("lawnForm");
const visit = document.getElementById("visit");
const photo = document.getElementById("photo");
const preview = document.getElementById("preview");
const town = document.getElementById("town");
const areaNote = document.getElementById("areaNote");
const sumPlan = document.getElementById("sumPlan");
const sumPrice = document.getElementById("sumPrice");
const status = document.getElementById("lawnStatus");

const today = new Date();
today.setDate(today.getDate() + 1);
visit.min = today.toISOString().slice(0, 10);

function selectedPlan() {
  return form.querySelector('input[name="plan"]:checked');
}

function paintSummary() {
  const plan = selectedPlan();
  sumPlan.textContent = plan.parentElement.querySelector("strong").textContent;
  sumPrice.textContent = "$" + plan.dataset.price;
}

form.addEventListener("change", (event) => {
  if (event.target.name === "plan") paintSummary();
  areaNote.hidden = town.value !== "Somewhere else";
});

photo.addEventListener("change", () => {
  const file = photo.files && photo.files[0];
  if (!file) {
    preview.style.display = "none";
    preview.removeAttribute("src");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.alt = "Yard photo preview";
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const street = document.getElementById("street").value.trim();
  status.hidden = false;
  if (!street || !visit.value) {
    status.style.color = "var(--accent)";
    status.textContent = "Add the street and a first-visit date.";
    return;
  }
  if (town.value === "Somewhere else") {
    status.style.color = "var(--accent)";
    status.textContent = "Harbor Lawn's sample area stops at Sandwich. Pick a town on the list.";
    return;
  }
  const plan = selectedPlan();
  const when = new Date(visit.value + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  status.style.color = "var(--glass-text)";
  status.textContent = `You're on the schedule for ${plan.parentElement.querySelector("strong").textContent.toLowerCase()} at ${street}, ${town.value}, on ${when}. First visit is $${plan.dataset.price}. Nothing was charged.`;
});

paintSummary();
