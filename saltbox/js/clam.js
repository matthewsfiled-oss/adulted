const ITEMS = [
  { id: "clams", name: "Fried clam plate", price: 28 },
  { id: "chowder", name: "Clam chowder", price: 9 },
  { id: "roll", name: "Lobster roll", price: 32 },
  { id: "rings", name: "Onion rings", price: 7 },
  { id: "slaw", name: "Coleslaw", price: 4 },
];
const SLOTS = ["11:30", "12:00", "12:30", "1:00", "5:00", "5:30"];

const cart = new Map();
let slot = "12:00";
let sold = new Set();
const tickets = [];

const menuList = document.getElementById("menuList");
const slots = document.getElementById("slots");
const cartBox = document.getElementById("cart");
const status = document.getElementById("orderStatus");
const ticketBox = document.getElementById("tickets");

function money(n) { return "$" + n.toLocaleString("en-US"); }

function renderMenu() {
  menuList.replaceChildren();
  ITEMS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-item" + (sold.has(item.id) ? " sold" : "");
    button.disabled = sold.has(item.id);
    const qty = cart.get(item.id) || 0;
    button.innerHTML = `<span><strong>${item.name}</strong>${sold.has(item.id) ? " · Sold out" : qty ? " · " + qty + " in bag" : ""}</span><span class="mono">${money(item.price)}</span>`;
    button.addEventListener("click", () => {
      cart.set(item.id, (cart.get(item.id) || 0) + 1);
      renderMenu();
      renderCart();
    });
    menuList.appendChild(button);
  });
}

function renderSlots() {
  slots.replaceChildren();
  SLOTS.forEach((time) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";
    button.textContent = time;
    button.setAttribute("aria-pressed", time === slot ? "true" : "false");
    button.addEventListener("click", () => {
      slot = time;
      renderSlots();
    });
    slots.appendChild(button);
  });
}

function renderCart() {
  cartBox.replaceChildren();
  let total = 0;
  if (!cart.size) {
    const empty = document.createElement("p");
    empty.className = "fine";
    empty.textContent = "Tap a dish to add it.";
    cartBox.appendChild(empty);
    return;
  }
  cart.forEach((qty, id) => {
    const item = ITEMS.find((entry) => entry.id === id);
    total += item.price * qty;
    const row = document.createElement("div");
    row.className = "cart-line";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn";
    remove.style.padding = "4px 8px";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      cart.delete(id);
      renderMenu();
      renderCart();
    });
    const label = document.createElement("span");
    label.textContent = `${qty} × ${item.name}`;
    const price = document.createElement("strong");
    price.className = "mono";
    price.textContent = money(item.price * qty);
    const left = document.createElement("span");
    left.style.display = "flex";
    left.style.gap = "8px";
    left.style.alignItems = "center";
    left.append(label, remove);
    row.append(left, price);
    cartBox.appendChild(row);
  });
  const totalRow = document.createElement("div");
  totalRow.className = "cart-line";
  totalRow.innerHTML = `<span>Pickup ${slot}</span><strong class="mono">${money(total)}</strong>`;
  cartBox.appendChild(totalRow);
}

function renderTickets() {
  ticketBox.replaceChildren();
  if (!tickets.length) {
    const empty = document.createElement("p");
    empty.className = "fine";
    empty.textContent = "No tickets yet. Place an order and it shows up here.";
    ticketBox.appendChild(empty);
    return;
  }
  tickets.forEach((ticket) => {
    const card = document.createElement("article");
    card.className = "ticket";
    card.innerHTML = `<strong>Ticket ${ticket.number} · ${ticket.slot}</strong><span>${ticket.name}</span><span>${ticket.lines}</span>`;
    ticketBox.appendChild(card);
  });
}

document.getElementById("kitchenToggle").addEventListener("change", (event) => {
  document.getElementById("kitchen").hidden = !event.target.checked;
});

document.getElementById("chowderSold").addEventListener("change", (event) => {
  if (event.target.checked) {
    sold.add("chowder");
    cart.delete("chowder");
  } else {
    sold.delete("chowder");
  }
  renderMenu();
  renderCart();
});

document.getElementById("place").addEventListener("click", () => {
  status.hidden = false;
  const name = document.getElementById("guest").value.trim();
  if (!name || !cart.size) {
    status.style.color = "var(--accent)";
    status.textContent = "Add at least one dish and a name for the bag.";
    return;
  }
  const lines = [];
  cart.forEach((qty, id) => {
    const item = ITEMS.find((entry) => entry.id === id);
    lines.push(`${qty} ${item.name}`);
  });
  const number = String(140 + tickets.length);
  tickets.unshift({ number, slot, name, lines: lines.join(", ") });
  cart.clear();
  renderMenu();
  renderCart();
  renderTickets();
  document.getElementById("kitchen").hidden = false;
  document.getElementById("kitchenToggle").checked = true;
  status.style.color = "var(--glass-text)";
  status.textContent = `Ticket ${number} is on the kitchen screen for ${name}. Pickup at ${slot}. Nothing was charged.`;
});

renderMenu();
renderSlots();
renderCart();
renderTickets();
