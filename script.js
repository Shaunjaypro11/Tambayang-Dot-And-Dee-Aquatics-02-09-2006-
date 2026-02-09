/* =========================================================
   LOADER
========================================================= */
const loader = document.getElementById("loader");

/* =========================================================
   HELPERS
========================================================= */
function getLoggedInUser() {
  return localStorage.getItem("loggedInUser");
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

/* =========================================================
   MOBILE MENU
========================================================= */
const menuBtn = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

/* =========================================================
   ACTIVE LINK
========================================================= */
let currentPage = location.pathname.split("/").pop();
if (!currentPage) currentPage = "index.html";

document.querySelectorAll(".nav-links a").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active-link");
  }
});

/* =========================================================
   PAGE ENTER
========================================================= */
window.addEventListener("load", () => {
  document.body.classList.add("page-loaded");
  document.body.classList.remove("page-exit");

  if (loader) {
    setTimeout(() => loader.classList.add("hide"), 300);
  }
});

/* =========================================================
   PAGE EXIT (SAFE + EXTERNAL LINKS ALLOWED)
========================================================= */
document.addEventListener("click", (e) => {
  if (e.target.closest("#cartModal")) return;
  if (e.target.closest(".auth-modal")) return;
  if (e.target.closest("form")) return;
  const link = e.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    link.target === "_blank" ||
    link.hasAttribute("download") ||
    /^https?:\/\//i.test(href)
  ) return;

  e.preventDefault();
  if (loader) loader.classList.remove("hide");
  document.body.classList.add("page-exit");

  setTimeout(() => {
    window.location.href = href;
  }, 400);
});

/* =========================================================
   SIGNUP
========================================================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!username || !password) {
      showPopup("warn", "Please fill all fields", "Warning");
      return;
    }

    const users = getUsers();

    if (users[username]) {
      showPopup("error", "Username already exists ❌", "Signup Failed");
      return;
    }

    users[username] = password;
    saveUsers(users);

    showPopup("success", "Account created! Please login ✅", "Success");
    window.location.href = "#loginModal";
  });
}

/* =========================================================
   LOGIN
========================================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const users = getUsers();

    if (!users[username]) {
      showPopup("error", "Account does not exist ❌", "Login Failed");
      return;
    }

    if (users[username] !== password) {
      showPopup("error", "Incorrect password ❌", "Login Failed");
      return;
    }

    localStorage.setItem("loggedInUser", username);

    const redirect =
      localStorage.getItem("redirectAfterLogin") || "shop.html";
    localStorage.removeItem("redirectAfterLogin");

    window.location.href = redirect;
  });
}

/* =========================================================
   USER PROFILE
========================================================= */
const userProfile = document.getElementById("userProfile");

if (userProfile) {
  const user = getLoggedInUser();

  if (user) {
    userProfile.innerHTML = `
      <span>👤 ${user}</span>
      <button id="logoutBtn">Logout</button>
    `;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      location.reload();
    });
  } else {
    userProfile.innerHTML = `<span>👥 Guest</span>`;
  }
}

/* =========================================================
   CART STORAGE
========================================================= */
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================================================
   REQUIRE LOGIN
========================================================= */
function requireLogin() {
  localStorage.setItem("redirectAfterLogin", "shop.html");
  window.location.href = "index.html#loginModal";
}

/* =========================================================
   CART ACTIONS
========================================================= */
function addToCart(name, price) {
  if (!getLoggedInUser()) {
    showPopup("error", "Please login to add items 🔐", "Login Required");
    setTimeout(requireLogin, 800);
    return;
  }

  const cart = getCart();
  const item = cart.find(i => i.name === name);

  if (item) item.quantity++;
  else cart.push({ name, price, quantity: 1 });

  saveCart(cart);
  showPopup("success", `${name} added to cart 🛒`, "Added");
}

/* =========================================================
   PRODUCT DATA
========================================================= */
function getProductData(btn) {
  const card = btn.closest(".product-card");
  if (!card) return null;

  const title = card.querySelector(".product-title")?.innerText.trim();
  const price = Number(
    card.querySelector(".price")?.innerText.replace(/[₱,]/g, "")
  );

  if (!title || isNaN(price)) return null;
  return { name: title, price };
}

/* =========================================================
   BUY NOW
========================================================= */
function buyNow(name, price) {
  if (!getLoggedInUser()) {
    showPopup("error", "Please login to continue 🔐", "Login Required");
    setTimeout(requireLogin, 800);
    return;
  }

  showConfirm(`Buy "${name}" for ₱${price}?`, () => {
    showPopup("success", `Thank you for buying ${name} 🐟`, "Purchase Complete");
  });
}

/* =========================================================
   PRODUCT BUTTONS
========================================================= */
document.querySelectorAll(".add-cart-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const product = getProductData(btn);
    if (product) addToCart(product.name, product.price);
  });
});

document.querySelectorAll(".buy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const product = getProductData(btn);
    if (product) buyNow(product.name, product.price);
  });
});

/* =========================================================
   CART MODAL
========================================================= */
function viewCart() {
  const cart = getCart();
  const modal = document.getElementById("cartModal");
  const items = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!modal || !items || !totalEl) return;

  items.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    items.innerHTML = "<p>Your cart is empty 🛒</p>";
    totalEl.textContent = "";
    modal.classList.add("show");
    return;
  }

  cart.forEach((item, i) => {
    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.name} x${item.quantity}</span>
      <span>₱${item.price * item.quantity}</span>
      <button>❌</button>
    `;

    div.querySelector("button").onclick = () => {
      cart.splice(i, 1);
      saveCart(cart);
      viewCart();
    };

    items.appendChild(div);
  });

  totalEl.textContent = `Total: ₱${total}`;
  modal.classList.add("show");
}

function closeCart() {
  document.getElementById("cartModal")?.classList.remove("show");
}

/* =========================================================
   CHECKOUT
========================================================= */
function checkout() {
  if (!getLoggedInUser()) {
    showPopup("error", "Login required 🔐", "Checkout");
    setTimeout(requireLogin, 800);
    return;
  }

  if (getCart().length === 0) {
    showPopup("warn", "Your cart is empty", "Cart");
    return;
  }

  localStorage.removeItem("cart");
  closeCart();
  showPopup("success", "Checkout successful 🐠", "Thank You");
}

/* =========================================================
   ESC CLOSE CART
========================================================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

/* =========================================================
   UI POPUPS
========================================================= */
function showPopup(type, message, title = "Notice") {
  const popup = document.getElementById("uiPopup");
  if (!popup) return;

  document.getElementById("popupTitle").innerText = title;
  document.getElementById("popupMessage").innerText = message;

  popup.className = "ui-popup show " + type;

  setTimeout(() => popup.classList.remove("show"), 2000);
}

let confirmCallback = null;

function showConfirm(message, onYes) {
  const popup = document.getElementById("confirmPopup");
  document.getElementById("confirmMessage").innerText = message;
  confirmCallback = onYes;
  popup.classList.add("show");
}

document.getElementById("confirmYes")?.addEventListener("click", () => {
  document.getElementById("confirmPopup").classList.remove("show");
  if (confirmCallback) confirmCallback();
});

document.getElementById("confirmNo")?.addEventListener("click", () => {
  document.getElementById("confirmPopup").classList.remove("show");
});

/* =========================================================
   FAQ TOGGLE
========================================================= */
document.querySelectorAll(".faq-item").forEach(item => {
  item.addEventListener("click", () => {
    const answer = item.querySelector(".faq-answer");
    if (!answer) return;

    answer.style.maxHeight
      ? (answer.style.maxHeight = null)
      : (answer.style.maxHeight = answer.scrollHeight + "px");
  });
});

/* ============================= */
/* FORMSPREE AJAX SUBMIT (NO POPUP) */
/* ============================= */
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🚫 stop Formspree popup

    const formData = new FormData(contactForm);

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        contactForm.reset();
        showPopup("success", "Message sent successfully 📩", "Thank You");
      } else {
        showPopup("error", "Failed to send message ❌", "Error");
      }
    } catch (err) {
      showPopup("error", "Network error. Try again later.", "Error");
    }
  });
}
