const RATE = 280;
const CLEANING = 150;
const calendar = document.getElementById("calendar");
const monthLabel = document.getElementById("monthLabel");
const status = document.getElementById("stayStatus");
const guide = document.getElementById("guide");

const cursor = new Date();
cursor.setDate(1);
let start = null;
let end = null;

function key(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function bookedKeys() {
  const taken = new Set();
  const seed = new Date();
  seed.setDate(seed.getDate() + 3);
  for (let i = 0; i < 4; i += 1) {
    const day = new Date(seed);
    day.setDate(seed.getDate() + i);
    taken.add(key(day));
  }
  const later = new Date();
  later.setDate(later.getDate() + 18);
  for (let i = 0; i < 3; i += 1) {
    const day = new Date(later);
    day.setDate(later.getDate() + i);
    taken.add(key(day));
  }
  return taken;
}

const taken = bookedKeys();

function nightsBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

function rangeHitsTaken(a, b) {
  const day = new Date(a);
  while (day < b) {
    if (taken.has(key(day))) return true;
    day.setDate(day.getDate() + 1);
  }
  return false;
}

function paintStay() {
  const nightCount = document.getElementById("nightCount");
  const stayTotal = document.getElementById("stayTotal");
  const deposit = document.getElementById("deposit");
  if (!start || !end) {
    nightCount.textContent = start ? "Now choose check-out" : "Select dates";
    stayTotal.textContent = "$0";
    deposit.textContent = "$0";
    return;
  }
  const nights = nightsBetween(start, end);
  const total = nights * RATE + CLEANING;
  nightCount.textContent = String(nights);
  stayTotal.textContent = "$" + total.toLocaleString("en-US");
  deposit.textContent = "$" + Math.round(total / 2).toLocaleString("en-US");
}

function render() {
  monthLabel.textContent = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  calendar.replaceChildren();
  ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((label) => {
    const heading = document.createElement("span");
    heading.className = "dow";
    heading.textContent = label;
    calendar.appendChild(heading);
  });
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i += 1) {
    const spacer = document.createElement("span");
    calendar.appendChild(spacer);
  }
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let dayNumber = 1; dayNumber <= days; dayNumber += 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), dayNumber);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day";
    button.textContent = String(dayNumber);
    const past = date <= today;
    const blocked = taken.has(key(date));
    button.disabled = past || blocked;
    if (start && key(date) === key(start)) button.classList.add("start");
    if (end && key(date) === key(end)) button.classList.add("end");
    if (start && end && date > start && date < end) button.classList.add("in");
    button.addEventListener("click", () => choose(date));
    calendar.appendChild(button);
  }
  paintStay();
}

function choose(date) {
  guide.hidden = true;
  status.hidden = true;
  if (!start || (start && end)) {
    start = date;
    end = null;
  } else if (date <= start) {
    start = date;
    end = null;
  } else if (nightsBetween(start, date) < 2) {
    status.hidden = false;
    status.style.color = "var(--accent)";
    status.textContent = "Bayberry's sample minimum is two nights.";
  } else if (rangeHitsTaken(start, date)) {
    status.hidden = false;
    status.style.color = "var(--accent)";
    status.textContent = "Those dates cross a booking that's already taken.";
  } else {
    end = date;
  }
  render();
}

document.getElementById("prevMonth").addEventListener("click", () => {
  cursor.setMonth(cursor.getMonth() - 1);
  render();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  cursor.setMonth(cursor.getMonth() + 1);
  render();
});

document.getElementById("reserve").addEventListener("click", () => {
  status.hidden = false;
  const name = document.getElementById("guestName").value.trim();
  if (!start || !end || !name) {
    status.style.color = "var(--accent)";
    status.textContent = "Choose check-in, check-out, and a guest name.";
    return;
  }
  const nights = nightsBetween(start, end);
  const total = nights * RATE + CLEANING;
  const due = Math.round(total / 2);
  const arrive = start.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  status.style.color = "var(--glass-text)";
  status.textContent = `Dates held on this screen for ${name}. Deposit would be $${due.toLocaleString("en-US")} of a $${total.toLocaleString("en-US")} stay. Nothing was charged.`;
  guide.hidden = false;
  document.getElementById("checkinText").textContent = `Check-in text: Hi ${name.split(" ")[0]}, Bayberry is ready ${arrive} at 3pm. Door code 4821. Wifi is on the fridge.`;
});

render();
