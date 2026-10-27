'use strict';
// 1. Product catalogue: all prices are in Indian rupees.
const products = [
  {id:1,name:'Wireless Headphones',category:'Electronics',price:1499,image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=640&h=480&fit=crop&fm=jpg'},
  {id:2,name:'Everyday Backpack',category:'Fashion',price:999,image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=640&h=480&fit=crop&fm=jpg'},
  {id:3,name:'Classic Notebook',category:'Stationery',price:199,image:'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=640&h=480&fit=crop&fm=jpg'},
  {id:4,name:'Smart Watch',category:'Electronics',price:2499,image:'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=640&h=480&fit=crop&fm=jpg'},
  {id:5,name:'Everyday Sneakers',category:'Fashion',price:1799,image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=640&h=480&fit=crop&fm=jpg'},
  {id:6,name:'Colour Pencil Set',category:'Stationery',price:299,image:'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=640&h=480&fit=crop&fm=jpg'},
  {id:7,name:'Portable Speaker',category:'Electronics',price:1299,image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=640&h=480&fit=crop&fm=jpg'},
  {id:8,name:'Cotton T-Shirt',category:'Fashion',price:599,image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=640&h=480&fit=crop&fm=jpg'},
  {id:9,name:'Ballpoint Pen',category:'Stationery',price:399,image:'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=640&h=480&fit=crop&fm=jpg'}
];
const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);
let cart = {};
let coupon = '';
let toastTimer;
// Restore only valid product IDs and integer quantities. Storage can be unavailable.
try {
  const saved = JSON.parse(localStorage.getItem('campus-cart') || '{}');
  products.forEach(p => {if (Number.isInteger(saved?.[p.id]) && saved[p.id] > 0 && saved[p.id] <= 99) cart[p.id] = saved[p.id];});
} catch { cart = {}; }
function saveCart() {
  try { localStorage.setItem('campus-cart',JSON.stringify(cart)); } catch { /* Cart still works in memory. */ }
}
function notify(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'),3000);
}
// 2. Search, category filtering and sorting operate together.
function renderProducts() {
  const query = $('search').value.trim().toLowerCase();
  let filtered = products.filter(p => p.name.toLowerCase().includes(query) && ($('category').value === 'all' || p.category === $('category').value));
  if ($('sort').value === 'low') filtered.sort((a,b) => a.price-b.price);
  if ($('sort').value === 'high') filtered.sort((a,b) => b.price-a.price);
  if ($('sort').value === 'name') filtered.sort((a,b) => a.name.localeCompare(b.name));
  $('results').textContent = `${filtered.length} products`;
  $('products').innerHTML = filtered.map(p => `<article class="product"><div class="product-art"><img src="${p.image}" alt="${p.name}" loading="lazy"></div><small>${p.category}</small><h3>${p.name}</h3><div class="product-bottom"><strong>${money(p.price)}</strong><button data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to cart</button></div></article>`).join('') || '<p class="empty">No products found. Try another search or category.</p>';
}
// 3. Totals are recalculated whenever the cart or coupon changes.
function calculateTotals() {
  const subtotal = products.reduce((sum,p) => sum + p.price * (cart[p.id] || 0),0);
  let discount = 0;
  if (coupon === 'STUDENT10') discount = Math.round(subtotal * 10) / 100;
  if (coupon === 'SAVE200' && subtotal >= 2000) discount = 200;
  return {subtotal,discount,total:subtotal-discount};
}
function renderCart() {
  const items = products.filter(p => cart[p.id]);
  $('cart-items').innerHTML = items.map(p => `<div class="cart-item"><img class="cart-image" src="${p.image}" alt="${p.name}"><div><h3>${p.name}</h3><p class="item-price">${money(p.price)} each · ${money(p.price*cart[p.id])}</p><div class="quantity"><button data-id="${p.id}" data-action="minus" aria-label="Decrease ${p.name} quantity">−</button><span>${cart[p.id]}</span><button data-id="${p.id}" data-action="plus" aria-label="Increase ${p.name} quantity" ${cart[p.id]>=99?'disabled':''}>+</button><button class="remove" data-id="${p.id}" data-action="remove">Remove</button></div></div></div>`).join('') || '<div class="empty">Your cart is empty.</div>';
  const totals = calculateTotals();
  $('subtotal').textContent = money(totals.subtotal);
  $('discount').textContent = '−' + money(totals.discount);
  $('total').textContent = money(totals.total);
  $('cart-count').textContent = Object.values(cart).reduce((sum,n) => sum+n,0);
  $('checkout').disabled = items.length === 0;
  $('clear').disabled = items.length === 0;
  $('remove-coupon').hidden = !coupon;
  if (coupon) $('coupon-message').textContent = coupon === 'SAVE200' && totals.subtotal < 2000 ? 'SAVE200 selected. Add items to reach ₹2,000 for ₹200 off.' : `${coupon} applied. You save ${money(totals.discount)}.`;
  saveCart();
}
$('products').addEventListener('click',event => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  const id = Number(button.dataset.add);
  if ((cart[id] || 0) >= 99) return notify('Maximum 99 units per product.');
  cart[id] = (cart[id] || 0) + 1;
  renderCart(); notify('Added to cart');
});
$('cart-items').addEventListener('click',event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === 'remove') delete cart[id];
  if (button.dataset.action === 'plus') cart[id] = Math.min(99,cart[id]+1);
  if (button.dataset.action === 'minus' && --cart[id] === 0) delete cart[id];
  renderCart();
});
$('search').addEventListener('input',renderProducts);
$('category').addEventListener('change',renderProducts);
$('sort').addEventListener('change',renderProducts);
$('clear').addEventListener('click',() => {cart={};renderCart();notify('Cart cleared');});
// 4. Only one coupon can be applied at a time.
$('coupon-form').addEventListener('submit',event => {
  event.preventDefault();
  const code = $('coupon').value.trim().toUpperCase();
  if (!['STUDENT10','SAVE200'].includes(code)) {
    $('coupon-message').textContent = 'Invalid code. Try STUDENT10 or SAVE200.' + (coupon ? ` ${coupon} remains selected.` : '');
    return;
  }
  coupon = code; renderCart();
});
$('remove-coupon').addEventListener('click',() => {
  coupon='';$('coupon').value='';$('coupon-message').textContent='Coupon removed. Try STUDENT10 or SAVE200.';renderCart();
});
// 5. Native form validation and a demo checkout; no server or real payment.
$('open-cart').addEventListener('click', () => {
  $('cart').showModal();
});
$('close-cart').addEventListener('click', () => {
  $('cart').close();
});

$('checkout').addEventListener('click',() => {
  $('cart').close();
  $('checkout-total').textContent=money(calculateTotals().total);
  $('checkout-dialog').showModal();
});
$('close-dialog').addEventListener('click',() => $('checkout-dialog').close());
$('checkout-form').addEventListener('submit',event => {
  event.preventDefault();
  const name = event.target.elements.name.value.trim();
  const address = event.target.elements.address.value.trim();
  if (!name || address.length < 10) return notify('Please enter a name and an address of at least 10 characters.');
  const amount = money(calculateTotals().total);
  $('checkout-dialog').close();
  notify(`Thank you, ${name}! Demo order placed for ${amount}.`);
  cart={};coupon='';$('coupon').value='';$('coupon-message').textContent='Try STUDENT10 or SAVE200 (min. ₹2,000).';
  event.target.reset();renderCart();
});
renderProducts();
renderCart();
