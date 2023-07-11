// Open a connection to the IndexedDB database
let db;

// Create object store and indexes
const request = indexedDB.open("HTTPRequestLoggerDB", 1);

request.onupgradeneeded = (event) => {
  db = event.target.result;

  const objectStore = db.createObjectStore("requests", {
    keyPath: "id",
    autoIncrement: true,
  });

  objectStore.createIndex("sessionName", "sessionName", { unique: false });
  objectStore.createIndex("pageTitle", "pageTitle", { unique: false });
  objectStore.createIndex("pageUrl", "pageUrl", { unique: false });
  objectStore.createIndex("requestUrl", "requestUrl", { unique: false });
  objectStore.createIndex("endpointName", "endpointName", { unique: false });
  objectStore.createIndex("queryParameterCount", "queryParameterCount", {
    unique: false,
  });
  objectStore.createIndex("responseSize", "responseSize", { unique: false });
  objectStore.createIndex("responseFilename", "responseFilename", {
    unique: false,
  });
};

request.onsuccess = (event) => {
  db = event.target.result;
};

// Function to store a captured request in IndexedDB
function storeRequest(capturedRequest) {
  const transaction = db.transaction(["requests"], "readwrite");
  const objectStore = transaction.objectStore("requests");

  const request = objectStore.add(capturedRequest);
  request.onsuccess = () => {
    console.log("Request stored in IndexedDB");
  };
  request.onerror = (error) => {
    console.error("Error storing request in IndexedDB", error);
  };
}

// Function to store captured requests in IndexedDB
function storeCapturedRequests() {
  capturedRequests.forEach((request) => {
    storeRequest(request);
  });
}

// Function to generate the filename for the response text file
function generateResponseFilename(capturedRequest) {
  const sessionName = capturedRequest.sessionName.replace(/\s/g, "_");
  const pageTitle = capturedRequest.pageTitle.replace(/\s/g, "_");
  const endpointName = capturedRequest.endpointName.replace(/\s/g, "_");
  const timeUnix = Math.floor(Date.now() / 1000);
  const timeFriendlyEst = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  });
  return `${sessionName}_${pageTitle}_${endpointName}_${timeUnix}_${timeFriendlyEst}.txt`;
}

// Function to handle file download when a response filename is clicked
function handleFileDownload(filename) {
  const transaction = db.transaction(["requests"], "readonly");
  const objectStore = transaction.objectStore("requests");
  const index = objectStore.index("responseFilename");
  const request = index.get(filename);

  request.onsuccess = (event) => {
    const capturedRequest = event.target.result;
    if (capturedRequest) {
      const responseText = `Headers:\n${capturedRequest.headers}\n\nPayload:\n${capturedRequest.payload}\n\nResponse:\n${capturedRequest.response}`;

      const blob = new Blob([responseText], { type: "text/plain" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;

      link.click();
    }
  };
}

// ... (previously defined code)

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startCapture") {
      capturedRequests = []; // Clear the previous captured requests
      sendResponse({ success: true });
    } else if (message.action === "stopCapture") {
      sendResponse({ success: true, capturedRequests });

      // Store captured requests in IndexedDB
      storeCapturedRequests();
    }
  });
});

// Message listener to receive intercepted requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capturedRequest") {
    capturedRequests.push(request.capturedRequest);
    sendResponse({ success: true });
  }
});

