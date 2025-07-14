document.addEventListener("DOMContentLoaded", function () {
  const saleCountEl = document.getElementById("saleCount");
  const refreshBtn = document.getElementById("refreshBtn");
  const toggleBtn = document.getElementById("toggleBtn");
  const thresholdSlider = document.getElementById("thresholdSlider");
  const thresholdDisplay = document.getElementById("thresholdDisplay");
  thresholdDisplay.textContent = thresholdSlider.value + "%";

  refreshBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: function () {
          document.querySelectorAll(".product-card").forEach((card) => {
            card.classList.remove("sale-highlighted", "not-sale");
            card.style.display = "block"; // Ensure all cards are visible
            card.dataset.saleHighlighted = "false";
          });
          thresholdSlider.value = 0; // Reset threshold slider
          document.getElementById("thresholdDisplay").textContent = "0%";
        },
      });
    });
  });

  toggleBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: function () {
          const highlights = document.querySelectorAll(".not-sale");
          if (highlights.length === 0) return false;
          
          const isVisible = highlights[0].style.display !== "none";
          const newDisplay = isVisible ? "none" : "block";
          
          highlights.forEach((el) => {
            el.style.display = newDisplay;
          });
          
          return !isVisible;
        },
      });
    });
  });

  let thresholdTimeout;

  thresholdSlider.addEventListener("input", function () {
    const threshold = parseInt(this.value);
    thresholdDisplay.textContent = threshold + "%";
    
    // Clear previous timeout
    clearTimeout(thresholdTimeout);
    
    // Debounce the actual processing
    thresholdTimeout = setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: function (threshold) {
              const productCards = document.querySelectorAll(SELECTORS.PRODUCT_CARDS);
              const discountSpans = document.querySelectorAll(SELECTORS.DISCOUNT_TEXT);
              
              // Reset all cards first
              productCards.forEach((card) => {
                card.classList.remove("sale-highlighted", "not-sale");
                card.style.display = "block";
                card.dataset.saleHighlighted = "false";
              });
              
              let highlightedCount = 0;
              
              // Process discounts
              discountSpans.forEach((span) => {
                const discountMatch = span.textContent;
                if (discountMatch) {
                  const match = discountMatch.match(/-(\d+)%/);
                  const discount = match ? parseInt(match[1]) : 0;
                  const parent = span.closest(SELECTORS.PRODUCT_CARDS);
                  
                  if (parent && discount >= threshold) {
                    parent.classList.add("sale-highlighted");
                    parent.dataset.saleHighlighted = "true";
                    highlightedCount++;
                  }
                }
              });
              
              // Add not-sale class to remaining cards
              productCards.forEach((card) => {
                if (!card.classList.contains("sale-highlighted")) {
                  card.classList.add("not-sale");
                  card.dataset.saleHighlighted = "false";
                }
              });
              
              return highlightedCount;
            },
            args: [threshold],
          },
          function (results) {
            if (results && results[0]) {
              saleCountEl.textContent = results[0].result || 0;
            }
          }
        );
      });
    }, 150); // 150ms delay
  });
});
