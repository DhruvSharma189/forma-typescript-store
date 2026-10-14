import "./style.css";

const API_URL = "https://dummyjson.com/products?limit=100";

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail?: string;
  images?: string[];
}

interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

type SortOption = "featured" | "price-low" | "price-high" | "rating" | "name";

const getElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
};

const grid = getElement<HTMLDivElement>("#productGrid");
const searchInput = getElement<HTMLInputElement>("#searchInput");
const categorySelect = getElement<HTMLSelectElement>("#categorySelect");
const sortSelect = getElement<HTMLSelectElement>("#sortSelect");
const resultsCount = getElement<HTMLSpanElement>("#resultsCount");
const loadMoreButton = getElement<HTMLButtonElement>("#loadMore");
const cartCount = getElement<HTMLSpanElement>("#cartCount");
const cartButton = getElement<HTMLButtonElement>("#cartButton");
const toast = getElement<HTMLDivElement>("#toast");

let allProducts: Product[] = [];
let visibleLimit = 12;
let cartItems = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const favourites = new Set<number>();

function escapeHTML(value: string | number = ""): string {
  return String(value).replace(/[&<>"']/g, (character: string): string => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function notify(message: string): void {
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer !== undefined) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function populateCategories(products: Product[]): void {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  categorySelect.innerHTML =
    '<option value="">All categories</option>' +
    categories
      .map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category.replaceAll("-", " "))}</option>`)
      .join("");
}

function getFilteredProducts(): Product[] {
  const query = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const result = allProducts.filter((product) => {
    const searchableText = `${product.title} ${product.description} ${product.brand ?? ""} ${product.category}`.toLowerCase();
    const matchesQuery = searchableText.includes(query);
    return matchesQuery && (!category || product.category === category);
  });

  const sortBy = sortSelect.value as SortOption;
  switch (sortBy) {
    case "price-low":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      result.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "name":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "featured":
    default:
      break;
  }
  return result;
}

function productCard(product: Product): string {
  const title = escapeHTML(product.title);
  const category = escapeHTML((product.category || "everyday").replaceAll("-", " "));
  const description = escapeHTML(product.description || "A thoughtful everyday find.");
  const image = escapeHTML(product.thumbnail || product.images?.[0] || "");
  const liked = favourites.has(product.id);
  const oldPrice = product.discountPercentage > 0
    ? `<span class="old-price">${money(product.price / (1 - product.discountPercentage / 100))}</span>`
    : "";

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <span class="category-tag">${category}</span>
        <button class="heart ${liked ? "active" : ""}" data-fav="${product.id}" aria-label="${liked ? "Remove from" : "Add to"} favourites" aria-pressed="${liked}">${liked ? "♥" : "♡"}</button>
        <img class="product-image" src="${image}" alt="${title}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="rating" aria-label="Rating ${Number(product.rating || 0).toFixed(1)} out of 5">★ <b>${Number(product.rating || 0).toFixed(1)}</b> <span>· ${Number(product.stock || 0)} in stock</span></div>
        <h3 class="product-title">${title}</h3>
        <p class="product-description">${description}</p>
        <div class="card-bottom"><div><span class="price">${money(product.price)}</span>${oldPrice}</div><button class="add-btn" data-add="${product.id}" aria-label="Add ${title} to bag">+</button></div>
      </div>
    </article>`;
}

function renderProducts(): void {
  const filtered = getFilteredProducts();
  const visible = filtered.slice(0, visibleLimit);
  resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`;
  loadMoreButton.hidden = visible.length >= filtered.length;

  if (visible.length === 0) {
    grid.innerHTML = '<div class="state"><strong>No products found.</strong><p>Try another search or category.</p></div>';
    return;
  }

  grid.innerHTML = visible.map(productCard).join("");
}

async function loadProducts(): Promise<void> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`API request failed (${response.status})`);

    const data = (await response.json()) as ProductsResponse;
    if (!Array.isArray(data.products)) throw new Error("Unexpected API response");

    allProducts = data.products;
    populateCategories(allProducts);
    renderProducts();
  } catch (error: unknown) {
    console.error(error);
    resultsCount.textContent = "Collection unavailable";
    grid.innerHTML = `<div class="state"><strong>We couldn't load the collection.</strong><p>Check your internet connection and try again.</p><button class="load-more" id="retryButton">Try again</button></div>`;
    getElement<HTMLButtonElement>("#retryButton").addEventListener("click", () => void loadProducts());
  }
}

searchInput.addEventListener("input", () => {
  visibleLimit = 12;
  renderProducts();
});

categorySelect.addEventListener("change", () => {
  visibleLimit = 12;
  renderProducts();
});

sortSelect.addEventListener("change", () => {
  visibleLimit = 12;
  renderProducts();
});

loadMoreButton.addEventListener("click", () => {
  visibleLimit += 12;
  renderProducts();
});

grid.addEventListener("error", (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLImageElement && target.classList.contains("product-image")) {
    target.style.opacity = ".15";
    target.alt = "Image unavailable";
  }
}, true);

grid.addEventListener("click", (event: MouseEvent) => {
  if (!(event.target instanceof Element)) return;

  const addButton = event.target.closest<HTMLButtonElement>("[data-add]");
  const favButton = event.target.closest<HTMLButtonElement>("[data-fav]");

  if (addButton) {
    const product = allProducts.find((item) => item.id === Number(addButton.dataset.add));
    if (product) {
      cartItems += 1;
      cartCount.textContent = String(cartItems);
      notify(`${product.title} added to your bag`);
    }
  }

  if (favButton) {
    const id = Number(favButton.dataset.fav);
    if (favourites.has(id)) favourites.delete(id);
    else favourites.add(id);
    renderProducts();
    notify(favourites.has(id) ? "Added to favourites" : "Removed from favourites");
  }
});

cartButton.addEventListener("click", () => {
  notify(cartItems
    ? `Your demo bag has ${cartItems} ${cartItems === 1 ? "item" : "items"}`
    : "Your bag is empty — find something you love.");
});

void loadProducts();
