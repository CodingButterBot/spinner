/**
 * Static SpinPick JavaScript
 * This file contains all JavaScript for the static-spinner.html fallback.
 */

// Update the current time
document.getElementById('current-time').textContent = new Date().toLocaleTimeString();

// Theme toggling
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  themeToggle.textContent = document.body.classList.contains('light-theme') 
    ? '🌙 Dark Mode' 
    : '☀️ Light Mode';
});

// Navigation
const showWheel = document.getElementById('show-wheel');
const showSlots = document.getElementById('show-slots');
const wheelComponent = document.getElementById('wheel-component');
const slotComponent = document.getElementById('slot-component');
const backFromWheel = document.getElementById('back-from-wheel');
const backFromSlots = document.getElementById('back-from-slots');

showWheel.addEventListener('click', () => {
  wheelComponent.style.display = 'block';
  slotComponent.style.display = 'none';
});

showSlots.addEventListener('click', () => {
  slotComponent.style.display = 'block';
  wheelComponent.style.display = 'none';
});

backFromWheel.addEventListener('click', () => {
  wheelComponent.style.display = 'none';
});

backFromSlots.addEventListener('click', () => {
  slotComponent.style.display = 'none';
});

// Spinning Wheel Implementation
const wheel = document.getElementById('wheel');
const spinButton = document.getElementById('spin-wheel');

// Sample data for the wheel
const wheelItems = [
  { label: 'Option 1', color: '#ef4444' },
  { label: 'Option 2', color: '#f59e0b' },
  { label: 'Option 3', color: '#10b981' },
  { label: 'Option 4', color: '#3b82f6' },
  { label: 'Option 5', color: '#8b5cf6' },
  { label: 'Option 6', color: '#ec4899' },
  { label: 'Option 7', color: '#6366f1' },
  { label: 'Option 8', color: '#14b8a6' }
];

// Create wheel sections
function createWheel(items) {
  wheel.innerHTML = '';
  const sectionAngle = 360 / items.length;
  
  items.forEach((item, index) => {
    const section = document.createElement('div');
    section.className = 'wheel-section';
    section.style.backgroundColor = item.color;
    section.style.transform = `rotate(${index * sectionAngle}deg)`;
    
    const label = document.createElement('div');
    label.className = 'section-text';
    label.textContent = item.label;
    
    section.appendChild(label);
    wheel.appendChild(section);
  });
}

// Initialize the wheel
createWheel(wheelItems);

// Spin the wheel
let isSpinning = false;
spinButton.addEventListener('click', () => {
  if (isSpinning) return;
  
  isSpinning = true;
  spinButton.disabled = true;
  
  // Random rotation between 2 and 5 full rotations + random portion
  const randomDegrees = Math.floor(Math.random() * 360);
  const fullRotations = Math.floor(Math.random() * 3) + 2; // 2-5 rotations
  const totalRotation = fullRotations * 360 + randomDegrees;
  
  wheel.style.transform = `rotate(${totalRotation}deg)`;
  
  // Calculate the winning item
  setTimeout(() => {
    const normalizedRotation = totalRotation % 360;
    const sectionAngle = 360 / wheelItems.length;
    const winningIndex = wheelItems.length - 1 - Math.floor(normalizedRotation / sectionAngle);
    
    alert(`You landed on: ${wheelItems[winningIndex].label}`);
    
    isSpinning = false;
    spinButton.disabled = false;
  }, 3000);
});

// Slot Machine Implementation
const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');
const pullLever = document.getElementById('pull-lever');

// Sample data for the slots
const slotItems = ['🍒', '🍊', '🍇', '🍓', '🍋', '🍎', '🥝', '🍉'];

// Create slot reels
function createSlotReel(reel, items) {
  reel.innerHTML = '';
  
  items.forEach(item => {
    const slotItem = document.createElement('div');
    slotItem.className = 'slot-item';
    slotItem.textContent = item;
    reel.appendChild(slotItem);
  });
}

// Initialize the slot machine
createSlotReel(reel1, slotItems);
createSlotReel(reel2, slotItems);
createSlotReel(reel3, slotItems);

// Function to spin a single reel
function spinReel(reel, items, duration, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Clone some items to create a smooth animation
      for (let i = 0; i < 20; i++) {
        const randomIndex = Math.floor(Math.random() * items.length);
        const slotItem = document.createElement('div');
        slotItem.className = 'slot-item';
        slotItem.textContent = items[randomIndex];
        reel.appendChild(slotItem);
      }
      
      // Animate the reel
      const offset = -(reel.children.length - 3) * 80;
      reel.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.83, 0.67)`;
      reel.style.transform = `translateY(${offset}px)`;
      
      // Resolve with the final item
      setTimeout(() => {
        const finalIndex = reel.children.length - 2;
        const finalItem = reel.children[finalIndex].textContent;
        resolve(finalItem);
      }, duration);
    }, delay);
  });
}

// Pull the slot machine lever
let isSpinningSlots = false;
pullLever.addEventListener('click', async () => {
  if (isSpinningSlots) return;
  
  isSpinningSlots = true;
  pullLever.disabled = true;
  
  // Reset reels
  reel1.style.transition = 'none';
  reel2.style.transition = 'none';
  reel3.style.transition = 'none';
  reel1.style.transform = 'translateY(0)';
  reel2.style.transform = 'translateY(0)';
  reel3.style.transform = 'translateY(0)';
  
  // Force reflow
  void reel1.offsetHeight;
  void reel2.offsetHeight;
  void reel3.offsetHeight;
  
  // Clear reels
  reel1.innerHTML = '';
  reel2.innerHTML = '';
  reel3.innerHTML = '';
  
  // Spin reels
  createSlotReel(reel1, slotItems);
  createSlotReel(reel2, slotItems);
  createSlotReel(reel3, slotItems);
  
  const result1 = await spinReel(reel1, slotItems, 1000, 0);
  const result2 = await spinReel(reel2, slotItems, 1500, 200);
  const result3 = await spinReel(reel3, slotItems, 2000, 400);
  
  // Check if all three are the same (jackpot!)
  if (result1 === result2 && result2 === result3) {
    alert(`JACKPOT! You got three ${result1}!`);
  } else {
    alert(`Results: ${result1} ${result2} ${result3}`);
  }
  
  isSpinningSlots = false;
  pullLever.disabled = false;
});