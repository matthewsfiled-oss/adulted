const BASES = [
  { id: "starter", name: "Starter Site", price: 350 },
  { id: "business", name: "Business Site", price: 750 },
  { id: "app", name: "Custom App", price: 1500 },
];

const GROUPS = [
  { title: "Booking & scheduling", note: "Fewer phone calls", items: [
    ["Online booking calendar", "Customers pick a time that's open. Syncs with your phone calendar.", 250, 0],
    ["Text & email reminders", "Automatic reminders that cut no-shows.", 100, 10],
    ["Deposits at booking", "Collect a deposit so people actually show up.", 100, 0],
    ["Recurring appointments", "Weekly mowing, monthly cleanings, standing visits.", 150, 0],
    ["Multiple staff calendars", "Each crew member or stylist gets their own schedule.", 150, 0],
  ]},
  { title: "Payments & selling", note: "Get paid online", items: [
    ["Online payments", "Card, Apple Pay and Google Pay through Stripe or Square.", 150, 0],
    ["Online store", "Sell products with cart, checkout and shipping or pickup.", 500, 0],
    ["Online ordering", "Menu ordering with pickup times for restaurants and cafés.", 550, 0],
    ["Quotes & invoices", "Send estimates customers approve and pay online.", 250, 0],
    ["Gift cards", "Sell digital gift cards, great for off-season cash.", 200, 0],
    ["Memberships & subscriptions", "Monthly plans that bill automatically.", 300, 0],
  ]},
  { title: "Customer features", note: "Keep them coming back", items: [
    ["Quote request form", "Smart form that asks the right questions for your trade.", 75, 0],
    ["Photo & file uploads", "Customers send pictures of the job before you drive out.", 75, 0],
    ["Customer accounts", "Login to see past orders, bookings and invoices.", 400, 0],
    ["Loyalty & rewards", "Points or punch cards that bring repeat business.", 300, 0],
    ["AI chat assistant", "Answers common questions 24/7 and collects leads.", 300, 25],
    ["Waivers & e-signatures", "Contracts and forms signed right on the phone.", 150, 0],
  ]},
  { title: "Content & pages", note: "Show off your work", items: [
    ["Photo gallery / portfolio", "Organized galleries of your best jobs.", 75, 0],
    ["Before & after slider", "Drag to compare. Perfect for trades and cleaning.", 75, 0],
    ["Menu page", "Easy-to-update menu with prices and seasonal items.", 100, 0],
    ["Reviews showcase", "Pull in your Google reviews automatically.", 75, 0],
    ["Service area map", "Show which towns you cover.", 50, 0],
    ["Blog or news page", "Post updates, specials and tips.", 100, 0],
    ["Extra pages", "Each additional page beyond your package.", 50, 0],
  ]},
  { title: "Marketing & growth", note: "Get found", items: [
    ["Google Business Profile setup", "Show up on Google Maps with photos and hours.", 100, 0],
    ["Local SEO package", "Pages and keywords for every town you serve.", 250, 0],
    ["Email list & newsletter", "Signup form and monthly email setup.", 150, 0],
    ["Coupons & promo popups", "Seasonal deals and first-visit discounts.", 75, 0],
    ["Social media feed", "Your Instagram or Facebook posts on your site.", 50, 0],
    ["Analytics dashboard", "See visitors, calls and where customers come from.", 75, 0],
  ]},
  { title: "Business tools", note: "Behind the scenes", items: [
    ["Admin dashboard", "One place to see bookings, orders and messages.", 300, 0],
    ["Lead & job tracker", "Track every lead from first call to paid.", 300, 0],
    ["Employee portal", "Schedules, job details and clock-in for your team.", 400, 0],
    ["Inventory tracking", "Know what's in stock and get low-stock alerts.", 300, 0],
    ["Custom forms & checklists", "Inspection sheets, intake forms, job checklists.", 100, 0],
  ]},
  { title: "Mobile app", note: "On their home screen", items: [
    ["Installable web app", "Customers add your site to their phone like an app.", 200, 0],
    ["iPhone & Android app", "Real app store listing for your business.", 1200, 20],
    ["Push notifications", "Send deals and reminders straight to phones.", 200, 10],
  ]},
  { title: "Setup & ongoing care", note: "We handle it", items: [
    ["Domain & business email", "yourbusiness.com and you@yourbusiness.com set up.", 50, 0],
    ["Logo & branding", "Simple logo, colors and fonts for your business.", 200, 0],
    ["Copywriting", "I write the words for every page.", 150, 0],
    ["Hosting & security", "Fast hosting, SSL, backups and updates.", 0, 29],
    ["Care plan", "Hosting plus monthly edits and priority support.", 0, 69],
    ["Spanish or Portuguese version", "Reach more customers on the Cape.", 250, 0],
    ["Accessibility upgrade", "ADA-friendly design for all visitors.", 150, 0],
  ]},
];

const BUNDLES = [
  {
    id: "landscaper",
    name: "Landscaper",
    blurb: "Weekly mowing sign-ups, reminders, and a yard photo before you roll.",
    base: "business",
    items: ["add-0-0", "add-0-1", "add-0-2", "add-0-3", "add-2-1", "add-3-4"],
  },
  {
    id: "clam",
    name: "Clam shack",
    blurb: "Order-ahead menu, pickup times, card payments, and gift cards.",
    base: "business",
    items: ["add-1-2", "add-1-0", "add-1-4", "add-3-2"],
  },
  {
    id: "rental",
    name: "Rental",
    blurb: "Direct booking, deposits, guest login, a rental agreement, and check-in texts.",
    base: "app",
    items: ["add-0-0", "add-0-1", "add-0-2", "add-2-2", "add-2-5"],
  },
];

const money = (n) => "$" + n.toLocaleString("en-US");

function lookup(id) {
  const parts = id.split("-");
  return GROUPS[Number(parts[1])].items[Number(parts[2])];
}

function quoteFor(baseId, picked) {
  const base = BASES.find((item) => item.id === baseId);
  let once = base.price;
  let monthly = 0;
  const lines = [];
  picked.forEach((id) => {
    const [name, , oneTime, perMonth] = lookup(id);
    once += oneTime;
    monthly += perMonth;
    lines.push(name);
  });
  return { base, once, monthly, lines };
}

function initQuote() {
  const basePick = document.getElementById("basePick");
  const menu = document.getElementById("menu");
  if (!basePick || !menu) return;

  const state = { base: "business", picked: new Set(), bundle: null };

  BASES.forEach((item) => {
    const label = document.createElement("label");
    const plus = item.id === "app" ? "+" : "";
    label.innerHTML = `<input type="radio" name="base" value="${item.id}" ${item.id === state.base ? "checked" : ""}> ${item.name} <span class="mono price-note">${money(item.price)}${plus}</span>`;
    basePick.appendChild(label);
  });

  GROUPS.forEach((group, groupIndex) => {
    const block = document.createElement("div");
    block.className = "menu-group";
    block.innerHTML = `<h3>${group.title}<span>${group.note}</span></h3>`;
    group.items.forEach((item, itemIndex) => {
      const [name, desc, once, monthly] = item;
      const id = `add-${groupIndex}-${itemIndex}`;
      const cost = [once ? money(once) : "", monthly ? `${money(monthly)}/mo` : ""].filter(Boolean).join(" + ");
      const label = document.createElement("label");
      label.className = "item";
      label.innerHTML = `<input type="checkbox" id="${id}"><span class="name">${name}</span><span class="cost">${cost}</span><span class="desc">${desc}</span>`;
      label.querySelector("input").addEventListener("change", (event) => {
        if (event.target.checked) state.picked.add(id);
        else state.picked.delete(id);
        state.bundle = null;
        syncBundles();
        update();
      });
      block.appendChild(label);
    });
    menu.appendChild(block);
  });

  const bundleRoot = document.getElementById("bundles");
  BUNDLES.forEach((bundle) => {
    const quote = quoteFor(bundle.base, new Set(bundle.items));
    const monthly = quote.monthly ? ` + ${money(quote.monthly)}/mo` : "";
    const priceLabel = (bundle.base === "app" ? "From " : "") + money(quote.once) + monthly;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bundle";
    button.dataset.bundle = bundle.id;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<strong>${bundle.name}</strong><span>${bundle.blurb}</span><b>${priceLabel}</b>`;
    button.addEventListener("click", () => applyBundle(bundle));
    bundleRoot.appendChild(button);
  });

  function syncBundles() {
    bundleRoot.querySelectorAll(".bundle").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.bundle === state.bundle ? "true" : "false");
    });
  }

  function applyBundle(bundle) {
    state.base = bundle.base;
    state.picked = new Set(bundle.items);
    state.bundle = bundle.id;
    basePick.querySelectorAll("input").forEach((input) => {
      input.checked = input.value === bundle.base;
    });
    menu.querySelectorAll("input").forEach((input) => {
      input.checked = state.picked.has(input.id);
    });
    syncBundles();
    update();
  }

  function update() {
    const quote = quoteFor(state.base, state.picked);
    const plus = quote.base.id === "app" ? "+" : "";
    document.getElementById("oneTime").textContent = money(quote.once) + plus;
    document.getElementById("monthly").textContent = money(quote.monthly) + "/mo";
    document.getElementById("baseName").textContent = quote.base.name;
    const list = document.getElementById("picked");
    list.replaceChildren();
    if (!quote.lines.length) {
      const empty = document.createElement("li");
      empty.textContent = "No add-ons yet";
      list.appendChild(empty);
    }
    quote.lines.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = "+ " + name;
      list.appendChild(li);
    });
    const dockPrice = document.getElementById("dockPrice");
    const dockMonthly = document.getElementById("dockMonthly");
    if (dockPrice) dockPrice.textContent = money(quote.once) + plus;
    if (dockMonthly) dockMonthly.textContent = money(quote.monthly) + "/mo";
  }

  function fillQuote() {
    const quote = quoteFor(state.base, state.picked);
    const plus = quote.base.id === "app" ? "+" : "";
    const message = document.getElementById("cMsg");
    message.value = `Base: ${quote.base.name}\nAdd-ons: ${quote.lines.length ? quote.lines.join(", ") : "none"}\nEstimate: ${money(quote.once)}${plus} one time + ${money(quote.monthly)}/mo\n\nAbout my business: `;
  }

  basePick.addEventListener("change", (event) => {
    if (event.target.name !== "base") return;
    state.base = event.target.value;
    state.bundle = null;
    syncBundles();
    update();
  });

  document.getElementById("clearAll").addEventListener("click", () => {
    state.picked.clear();
    state.bundle = null;
    menu.querySelectorAll("input").forEach((input) => { input.checked = false; });
    syncBundles();
    update();
  });

  document.getElementById("sendQuote").addEventListener("click", fillQuote);
  const dockQuote = document.getElementById("dockQuote");
  if (dockQuote) dockQuote.addEventListener("click", fillQuote);

  const dock = document.getElementById("dock");
  const build = document.getElementById("build");
  const contact = document.getElementById("contact");
  if (dock && build && contact) {
    const summary = document.querySelector(".summary");
    const dockWatcher = () => {
      if (window.innerWidth > 860) {
        dock.classList.remove("visible");
        document.body.classList.remove("dock-on");
        return;
      }
      const menuBox = document.getElementById("menu").getBoundingClientRect();
      const summaryBox = summary.getBoundingClientRect();
      const summaryVisible = summaryBox.top < window.innerHeight - 90 && summaryBox.bottom > 40;
      const menuOnScreen = menuBox.top < window.innerHeight * 0.5 && menuBox.bottom > 180;
      const show = menuOnScreen && !summaryVisible;
      dock.classList.toggle("visible", show);
      document.body.classList.toggle("dock-on", show);
    };
    window.addEventListener("scroll", dockWatcher, { passive: true });
    window.addEventListener("resize", dockWatcher);
    dockWatcher();
  }

  const form = document.getElementById("contactForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.getElementById("formStatus");
    const name = document.getElementById("cName").value.trim();
    const email = document.getElementById("cEmail").value.trim();
    status.hidden = false;
    if (!name || !/.+@.+\..+/.test(email)) {
      status.style.color = "var(--accent)";
      status.textContent = "Add your name and a valid email so I can reply.";
      return;
    }
    const body = new URLSearchParams(new FormData(form)).toString();
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }).then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      status.style.color = "var(--glass-text)";
      status.textContent = `Thanks, ${name.split(" ")[0]}. Your request was sent. I'll be in touch within one business day.`;
      form.reset();
      state.base = "business";
      state.picked.clear();
      state.bundle = null;
      basePick.querySelectorAll("input").forEach((input) => { input.checked = input.value === "business"; });
      menu.querySelectorAll("input").forEach((input) => { input.checked = false; });
      syncBundles();
      update();
    }).catch(() => {
      status.style.color = "var(--accent)";
      status.textContent = "That didn't go through. Please try again in a minute.";
    });
  });

  update();
}

initQuote();
