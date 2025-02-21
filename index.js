let searchLimit = 0;
let searchCount = 0;
let isPaused = false;
let activeAutomation = null;
let isAutomationRunning = false;
let username = "Store the email id...";
const today = new Date().getDate();
const headerName = document.getElementById("header-span");
const searchDeviceDropdown = document.getElementById("searchDevice");
const searchCountDropdown = document.getElementById("searchCount");
const timerDropdown = document.getElementById("timerDropdown");
const customTimerInput = document.getElementById("customTimerInput");
const focusTabsCheckbox = document.getElementById("focusTabs");
const builtinTimerCheckbox = document.getElementById("builtinTimer");
const saveButton = document.getElementById("save-btn");
const restButton = document.getElementById("reset-btn");
const progressBarFill = document.querySelector(".progress-bar-fill");
const limitInfo = document.getElementById("limitInfo");
const timerInfo = document.getElementById("timerInfo");
const startProcess = document.getElementById("task-btn");
const stopProcess = document.getElementById("stop-btn");
const closeBtn = document.getElementById("close-btn");

// Custom timer Input visibility
timerDropdown.addEventListener("change", () => {
  const showCustom = timerDropdown.value === "custom";
  customTimerInput.style.display = showCustom ? "block" : "none";
  if (showCustom) customTimerInput.focus();
});

// Get timer in seconds
function getTimerValue() {
  if (timerDropdown.value === "custom") {
    const customValue = parseInt(customTimerInput.value, 10);
    if (isNaN(customValue) || customValue <= 0) {
      alert("Please enter a valid custom timer value.");
      return null;
    }
    return customValue * 1000;
  }
  return parseInt(timerDropdown.value, 10) * 1000;
}

// Update progress Bar based on values
function updateUI(searchCount, searchLimit) {
  chrome.storage.sync.set({ lastSearchCount: searchCount });
  const remainingCount = Math.max(searchLimit - searchCount, 0);
  console.log(
    `Total searches Remaining: ${remainingCount} of Total search count: ${searchLimit} at the time of ${new Date().toLocaleTimeString()}`
  );
  document.getElementById("count").textContent = searchCount;
  document.getElementById("remainingCount").textContent = remainingCount;
  if (progressBarFill) {
    const progressPercent =
      searchLimit > 0 ? (searchCount / searchLimit) * 100 : 0;
    progressBarFill.style.width = Math.min(progressPercent, 100) + "%";
  }
}

// Update time every second
function updateTime() {
  timerInfo.style.display = activeAutomation != null ? "block" : "none";
  timerInfo.textContent = new Date().toLocaleTimeString();
}

//  Update button state
function updateButtonState() {
  const buttonToDisable = [saveButton, restButton, closeBtn];
  const disableState = isAutomationRunning;

  buttonToDisable.forEach((button) => {
    if (button) {
      button.disabled = disableState;
      button.style.cursor = disableState ? "not-allowed" : "pointer";
    }
  });
  if (stopProcess) {
    stopProcess.disabled = !isAutomationRunning;
    stopProcess.style.cursor = isAutomationRunning ? "pointer" : "not-allowed";
  }
  if (startProcess) {
    startProcess.textContent = isAutomationRunning
      ? isPaused
        ? "Resume Automation"
        : "Pause Automation"
      : "Start Automation";
  }
}
updateButtonState();
// Get values from local storage
chrome.storage.sync.get(
  {
    username: "Store the email id...",
    searchDevice: null,
    searchCount: 0,
    customTimer: 0,
    focusTabs: false,
    builtinTimer: false,
    lastDate: today,
    lastSearchCount: 0,
  },
  (data) => {
    if (data.lastDate !== today) {
      searchCount = 0;
      chrome.storage.sync.set({ lastDate: today, lastSearchCount: 0 });
    } else {
      searchCount = data.lastSearchCount || 0;
    }
    username = data.username;
    headerName.textContent = data.username;
    searchDeviceDropdown.value = data.searchDevice;
    searchCountDropdown.value = data.searchCount || 0;
    timerDropdown.value = data.customTimer > 0 ? data.customTimer / 1000 : 0;
    customTimerInput.value = data.customTimer / 1000 || "";
    searchLimit = parseInt(data.searchCount, 10) || 0;
    focusTabsCheckbox.checked = data.focusTabs;
    builtinTimerCheckbox.checked = data.builtinTimer;
    limitInfo.style.display = searchLimit > 0 ? "none" : "block";
    if (searchLimit === 0) {
      limitInfo.textContent =
        "Please set all the values to start the automation.";
    }
    logInfo(data);
    updateUI(searchCount, searchLimit);
  }
);

// Save all the values to local storage
saveButton.addEventListener("click", () => {
  const newSearchLimit = parseInt(searchCountDropdown.value, 10);
  const customTimer = getTimerValue();
  const searchDevice = searchDeviceDropdown.value;
  searchCount = 0;
  if (isNaN(newSearchLimit) || newSearchLimit <= 0) {
    return alert("Please enter a valid search count.");
  }
  if (!searchDevice || searchDevice === "null") {
    return alert("Please select the device.");
  }
  if (username === "Store the email id...") {
    username = prompt("Please enter your email id to proceed.");
    if (!username || !username.includes("@") || !username.includes(".")) {
      username = "Store the email id...";
      return;
    }
  }

  const settings = {
    username,
    searchDevice,
    searchCount: newSearchLimit,
    customTimer,
    focusTabs: focusTabsCheckbox.checked,
    builtinTimer: builtinTimerCheckbox.checked,
    lastDate: today,
    lastSearchCount: searchCount,
  };

  chrome.storage.sync.set(settings, () => {
    headerName.textContent = username;
    updateUI(searchCount, newSearchLimit);
    logInfo(settings);
    alert("Settings Saved!!! Please refresh the page.");
  });
});

// Utility function to log debug information
function logInfo(data) {
  console.log(`
==================== System Info ====================
  Username           : ${data.username}
  Search Device      : ${data.searchDevice}
  Search Limit       : ${data.searchCount}
  Last Search Count  : ${data.lastSearchCount} 
  Custom Timer       : ${data.customTimer}
  Focus Tabs         : ${data.focusTabs}
  Builtin Timer      : ${data.builtinTimer}
  Last Date          : ${data.lastDate}
====================================================
  `);
}

// Reset all automation tasks
restButton.addEventListener("click", () => {
  console.log("Reset is triggered.");
  chrome.storage.sync.set(
    {
      username: "Store the email id...",
      searchDevice: null,
      searchCount: 0,
      customTimer: 0,
      focusTabs: false,
      builtinTimer: false,
      lastDate: today,
      lastSearchCount: 0,
    },
    () => {
      updateUI(0, 0);
      alert("Reset Successfully!!! Please refresh the page.");
    }
  );
});

// Start/Pause/Resume automation task
startProcess.addEventListener("click", () => {
  const searchDevice = searchDeviceDropdown.value;
  const newSearchLimit = parseInt(searchCountDropdown.value, 10);
  const customTimer = getTimerValue();
  const builtinTimer = builtinTimerCheckbox.checked;
  if (searchDevice === "null" || !searchDevice) {
    alert("Please select the device.");
    return;
  }
  if (!isAutomationRunning) {
    if (builtinTimer) {
      if (isNaN(newSearchLimit) || newSearchLimit <= 0) {
        alert("Please enter a valid search count.");
        return;
      }
      searchCount = 0;
      searchLimit = newSearchLimit;
      activeAutomation = "builtinTimer";
      updateUI(searchCount, searchLimit);
      console.log("Start Builtin Timer Automation is triggered.");
      chrome.runtime.sendMessage({
        action: "startBuiltinTimer",
        searchCount: searchLimit,
      });
    } else {
      if (
        isNaN(customTimer) ||
        isNaN(newSearchLimit) ||
        customTimer <= 0 ||
        newSearchLimit <= 0
      ) {
        alert("Please enter a valid timer and search count.");
        return;
      }
      searchCount = 0;
      searchLimit = newSearchLimit;
      activeAutomation = "customTimer";
      updateUI(searchCount, searchLimit);
      console.log("Start Custom automation process is triggered.");
      chrome.runtime.sendMessage({
        action: "startCustomTimer",
        searchCount: searchLimit,
        customTimer: customTimer,
      });
    }
    isAutomationRunning = true;
    updateButtonState();
  } else if (isPaused) {
    // Resume Automation
    isPaused = false;
    updateButtonState();
    chrome.runtime.sendMessage({
      action: "resumeAutomation",
      type: activeAutomation,
    });
  } else {
    // Pause Automation
    isPaused = true;
    updateButtonState();
    chrome.runtime.sendMessage({
      action: "pauseAutomation",
      type: activeAutomation,
    });
  }
});

// Stop all the process
stopProcess.addEventListener("click", () => {
  console.log("Stop Automation is triggered.");
  isPaused = false;
  isAutomationRunning = false;
  activeAutomation = null;
  updateButtonState();
  chrome.runtime.sendMessage({ action: "stopAutomation" });
});

// Close all the opened tabs
closeBtn.addEventListener("click", () => {
  if (isAutomationRunning) {
    alert(
      "Please stop the running automation process before closing the tabs."
    );
    return;
  }
  chrome.runtime.sendMessage({ action: "closeTabs" });
});

// Listener for background messages to update progress
chrome.runtime.onMessage.addListener((message) => {
  if (message.action == "incrementsearchCount") {
    chrome.storage.sync.get(
      {
        searchCount: 0,
        lastSearchCount: 0,
      },
      (data) => {
        searchCount = data.lastSearchCount || 0;
        searchLimit = data.searchCount || 0;
        chrome.storage.sync.set({ lastSearchCount: searchCount + 1 }, () => {
          if (searchCount + 1 == searchLimit) {
            isAutomationRunning = false;
            isPaused = false;
            updateButtonState();
          }
          updateUI(searchCount + 1, searchLimit);
          updateButtonState();
        });
      }
    );
  }
});

// Listener for background messages to update time
chrome.runtime.onMessage.addListener((message) => {
  if (message.action == "updateTime") {
    updateTime();
  }
});
