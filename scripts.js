// Define probabilities for each rarity
const prizeProbabilities = [
  { rarity: "common", probability: 0.4 },
  { rarity: "rare", probability: 0.5 },
  { rarity: "superRare", probability: 0.08 },
  { rarity: "ultraRare", probability: 0.02 },
];

const PROBABILITY_INCREMENT = 0.02;
const TARGET_ROLL_COUNT = 50;

const jsonFiles = ["defaultGachaOps.json", "bannerFeaturedGachaOps.json"];
let gachaOps = {};
let rateUpOperator = {};
let totalRolls = 0;

// Function to load and merge all JSON files, including rateUpGachaOps
async function loadData() {
  try {
    // Load main gacha files
    const fetchPromises = jsonFiles.map((file) =>
      fetch(file).then((response) => response.json())
    );

    // Also load rateUpGachaOps.json
    fetchPromises.push(
      fetch("rateUpGachaOps.json").then((response) => response.json())
    );

    // Wait for all fetches to complete
    const jsonDataArray = await Promise.all(fetchPromises);

    // Process main gacha files
    jsonDataArray.slice(0, jsonFiles.length).forEach((data) => {
      Object.keys(data).forEach((rarity) => {
        if (!gachaOps[rarity]) {
          gachaOps[rarity] = []; // Initialize category if it doesn't exist
        }
        gachaOps[rarity] = gachaOps[rarity].concat(data[rarity]); // Merge items
      });
    });

    // Assign rate-up data (last item in jsonDataArray) to rateUpOperator
    rateUpOperator = jsonDataArray[jsonDataArray.length - 1];

    console.log("Gacha ops Loaded Successfully:", gachaOps);
    console.log("RateUp ops Loaded Successfully:", rateUpOperator);
  } catch (error) {
    console.error("Error loading gacha ops:", error);
  }
}

// Call the function to load items
loadData();

// Define default count for each rarity
const rarityCounts = {
  common: 0,
  rare: 0,
  superRare: 0,
  ultraRare: 0,
};

// Define the default increasing probablity for the ultrarare rarity
const increasedCount = {
  rollCounts: 0,
  ultraRareCounts: 0,
};

// Define original probabilities for each rarity
const originalProbabilities = {
  common: 0.4,
  rare: 0.5,
  superRare: 0.08,
  ultraRare: 0.02,
};

// Function to adjust probabilities for ultraRare
function adjustUltraRareProbability() {
  if (
    increasedCount.rollCounts >= TARGET_ROLL_COUNT &&
    increasedCount.ultraRareCounts === 0
  ) {
    // Increase ultraRare probability by the defined increment
    prizeProbabilities.forEach((prize) => {
      if (prize.rarity === "ultraRare") {
        prize.probability += PROBABILITY_INCREMENT; // Increase ultraRare probability
      }
    });

    // Ensure total probabilities remain 1.0
    const totalProbability = prizeProbabilities.reduce(
      (acc, prize) => acc + prize.probability,
      0
    );

    // Normalize the probabilities if the total exceeds 1
    if (totalProbability > 1) {
      const normalizationFactor = 1 / totalProbability;
      prizeProbabilities.forEach((prize) => {
        prize.probability *= normalizationFactor; // Normalize the probabilities
      });
    }
  }
}

// Function to determine the rarity based on probability
function getRarity() {
  const rand = Math.random();
  let accumulatedProbability = 0;

  for (const prize of prizeProbabilities) {
    accumulatedProbability += prize.probability;
    if (rand < accumulatedProbability) {
      return prize.rarity;
    }
  }
  return "common"; // Default to common if no other is selected
}

// Function to roll gacha and get a single prize
function rollGacha() {
  adjustUltraRareProbability(); // Adjust ultraRare probability before rolling

  const rarity = getRarity();
  const operator = gachaOps[rarity];

  // Update the count for the drawn rarity
  rarityCounts[rarity]++;
  totalRolls++;

  // Update the count for increased probabilities
  increasedCount.rollCounts++;

  // If ultraRare is drawn, reset the ultraRare probability
  if (rarity === "ultraRare") {
    prizeProbabilities.forEach((prize) => {
      prize.probability = originalProbabilities[prize.rarity];
    });
    increasedCount.rollCounts = 0;
  }

  // Apply rate-up boost if the item has a rate-up chance
  const rateUp = rateUpOperator[rarity];
  if (rateUp) {
    for (const rateOps of rateUp) {
      if (Math.random() < rateOps.boostChance) {
        return {
          name: rateOps.name,
          rarity: capitalize(rarity),
          class: getOperatorClass(rateOps.name, rarity),
        }; // Return the rate-up item
      }
    }
  }

  // If no rate-up item is selected, pick a random item in this rarity
  const randomOps = operator[Math.floor(Math.random() * operator.length)];
  return {
    name: randomOps.name,
    rarity: capitalize(rarity),
    class: randomOps.class,
  };
}

// Function to handle single roll
function singleRoll() {
  const result = rollGacha();
  displayResults([result]);
  displayCounts(); // Update counts display after each roll
}

// Function to handle batch roll (10 rolls)
function batchRoll() {
  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push(rollGacha());
  }
  displayResults(results);
  displayCounts(); // Update counts display after each roll
  console.log(results);
}

// Function to display results
// function displayResults(results) {
//   const prizeList = document.getElementById("prizeList");
//   prizeList.innerHTML = ""; // Clear previous results
//   results.forEach((result) => {
//     const listOps = document.createElement("li");
//     listOps.textContent = result;
//     prizeList.appendChild(listOps);
//   });
//   console.log(results);
// }
function displayResults(results) {
  const prizeList = document.getElementById("prizeList");
  prizeList.style.display = 'flex';
  prizeList.innerHTML = ""; // Clear previous results

  let backgroundColor;

  // Set background color based on parameter

  results.forEach((result) => {
    // Create a new div for each image result
    const imageDiv = document.createElement("div");
    imageDiv.classList.add("cropped-background");

    console.log(toSnakeCase(result.name));
  
    // Set the background image
    const imageUrl = `url(arknights_images/${toSnakeCase(result.name)}.png)`;
  
    if (result.rarity === "UltraRare") {
      imageDiv.classList.add("glowing-6");
      imageDiv.style.background = `${imageUrl}, linear-gradient(to right, rgba(201, 77, 30, 0.8), rgba(254, 255, 91, 0.8))`;
    } else if (result.rarity === "Rare") {
      imageDiv.classList.add("glowing-4");
      imageDiv.style.backgroundColor = "#84838a";
      imageDiv.style.backgroundImage = imageUrl;
    } else if (result.rarity === "SuperRare") {
      imageDiv.classList.add("glowing-5");
      imageDiv.style.backgroundColor = "#f8f8f8";
      imageDiv.style.backgroundImage = imageUrl;
    } else {
      imageDiv.style.backgroundColor = "#2d2d2d"; // Default color
      imageDiv.style.backgroundImage = imageUrl;
    }
  
    // Ensure background size and position
    imageDiv.style.backgroundSize = "cover";
    imageDiv.style.backgroundPosition = "center";
  
    // Append the new div to the prize list container
    prizeList.appendChild(imageDiv);
  });
  
}

function displayCounts() {
  // Display the counts for each rarity
  const countDisplay = document.getElementById("countDisplay");
  countDisplay.innerHTML = ""; // Clear previous counts

  prizeProbabilities.forEach((prize) => {
    const countItem = document.createElement("div");
    countItem.textContent = `${capitalize(prize.rarity)} Count: ${
      rarityCounts[prize.rarity] || 0
    }`;
    countDisplay.appendChild(countItem);
  });

  // Display total rolls
  const totalRollsDisplay = document.createElement("div");
  totalRollsDisplay.textContent = `Total Rolls: ${totalRolls}`;
  countDisplay.appendChild(totalRollsDisplay);

  // Display current probabilities
  const probabilityDisplay = document.createElement("div");
  probabilityDisplay.textContent = "Current Probabilities:";
  countDisplay.appendChild(probabilityDisplay);

  prizeProbabilities.forEach((prize) => {
    const probabilityItem = document.createElement("div");
    probabilityItem.textContent = `${capitalize(prize.rarity)} Probability: ${
      prize.probability
    }`;
    countDisplay.appendChild(probabilityItem);
  });
}

// Utility function to capitalize rarity names
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Utility function to snakecase names
function toSnakeCase(str) {
  return str.split(" ").join("_");
}

// Function to get item type based on name
function getOperatorClass(operatorName, rarity) {
  const operators = gachaOps[rarity];
  const foundOps = operators.find((operator) => operator.name === operatorName);
  return foundOps ? foundOps.class : "Unknown";
}

// Event listeners for the roll buttons
document
  .getElementById("singleRollButton")
  .addEventListener("click", singleRoll);
document.getElementById("batchRollButton").addEventListener("click", batchRoll);

displayCounts();
