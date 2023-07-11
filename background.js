// Open a connection to the IndexedDB database
const request = indexedDB.open("HTTPRequestLoggerDB", 1);
let db;

// Create object store and indexes
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

// Handle database open success
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
  // Retrieve the captured request with the corresponding response filename
  const transaction = db.transaction(["requests"], "readonly");
  const objectStore = transaction.objectStore("requests");
  const index = objectStore.index("responseFilename");
  const request = index.get(filename);

  request.onsuccess = (event) => {
    const capturedRequest = event.target.result;
    if (capturedRequest) {
      // Generate the text content for the response
      const responseText = `Headers:\n${capturedRequest.headers}\n\nPayload:\n${capturedRequest.payload}\n\nResponse:\n${capturedRequest.response}`;

      // Create a Blob with the text content
      const blob = new Blob([responseText], { type: "text/plain" });

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;

      // Simulate a click on the link to start the download
      link.click();
    }
  };
}

//... (previously defined code)
// Initialize an empty array to store captured requests
let capturedRequests = [];

// Listen for requests using the webRequest API
chrome.webRequest.onBeforeRequest.addListener(
	(details) => {
		// Capture the request details
		const capturedRequest = {
			sessionName: '',
			pageTitle: '',
			pageUrl: '',
			requestUrl: details.url,
			endpointName: '',
			queryParameterCount: 0,
			responseSize: 0,
			responseFilename: ''
		};

		// Retrieve additional information about the request
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const activeTab = tabs[0];
			capturedRequest.pageTitle = activeTab.title;
			capturedRequest.pageUrl = activeTab.url;
		});

		// Store the captured request in the array
		capturedRequests.push(capturedRequest);
	},
	{ urls: ["<all_urls>"] },
	["requestHeaders"]
);

// Listen for completed requests to capture response data
chrome.webRequest.onCompleted.addListener(
	(details) => {
		// Find the captured request in the array and update its response details
		const capturedRequest = capturedRequests.find(
			(request) => request.requestUrl === details.url
		);

		if (capturedRequest) {
			capturedRequest.responseSize = details.responseHeaders.reduce(
				(totalSize, header) => {
					if (header.name.toLowerCase() === "content-length") {
						return parseInt(header.value);
					}
					return totalSize;
				},
				0
			);

			// Generate a filename for the response text file
			const currentTime = new Date();
			const timeUnix = Math.floor(currentTime.getTime() / 1000);
			const timeFriendlyEst = currentTime.toLocaleString("en-US", {
				timeZone: "America/New_York",
			});
			capturedRequest.responseFilename = `${capturedRequest.sessionName}_${capturedRequest.pageTitle}_${capturedRequest.endpointName}_${timeUnix}_${timeFriendlyEst}.txt`;
		}
	},
	{ urls: ["<all_urls>"] },
	["responseHeaders"]
);

// Listen for messages from the popup to start or stop session capture
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "startCapture") {
		capturedRequests = []; // Clear the previous captured requests
		sendResponse({ success: true });
	} else if (message.action === "stopCapture") {
		sendResponse({ success: true, capturedRequests });
	}
});


// Listen for messages from the popup to start or stop session capture
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


// Listen for clicks on response filenames to trigger file download
chrome.browserAction.onClicked.addListener((tab) => {
  const filename = tab.url.substring(tab.url.lastIndexOf("/") + 1);
  handleFileDownload(filename);
});
