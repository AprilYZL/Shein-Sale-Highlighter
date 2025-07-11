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
          const isVisible =
            highlights.length > 0 && highlights[0].style.display !== "none";
          highlights.forEach((el) => {
            el.style.display = isVisible ? "none" : "block";

          });
          return !isVisible;
        },
      });
    });
  });

  thresholdSlider.addEventListener("input", function () {
    const threshold = parseInt(this.value);
    thresholdDisplay.textContent = threshold + "%";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: function (threshold) {
             const highlights = document.querySelectorAll(".not-sale");
            highlights.forEach((el) => {
              el.style.display = "block"; // Ensure all cards are visible
            });
            let highlightedCount = 0;
            document.querySelectorAll(".discount-text").forEach((span) => {
              const discountMatch = span.textContent;
              if (discountMatch) {
                const match = discountMatch.match(/-(\d+)%/);
                const discount = match ? parseInt(match[1]) : 0;
                const parent = span.closest(".product-card");
                if (parent) {
                  if (discount >= threshold) {
                    if (!parent.classList.contains("sale-highlighted")) {
                      parent.classList.add("sale-highlighted");
                      parent.dataset.saleHighlighted = "true";
                    }
                    highlightedCount++;
                    parent.classList.remove("not-sale");
                  } else {
                    parent.classList.remove("sale-highlighted");
                    // parent.classList.add('not-sale');
                    parent.dataset.saleHighlighted = "false";
                  }
                }
              }
            });

            document.querySelectorAll(".product-card").forEach((card) => {
              if (
                !card.classList.contains("sale-highlighted") &&
                !card.classList.contains("not-sale")
              ) {
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
  });
});
