// Open a connection to the IndexedDB database
let db;

// Create object store and indexes
const request = indexedDB.open("HTTPRequestLoggerDB", 1);

request.onupgradeneeded = (event) => {
	db = event.target.result;

	const objectStore = db.createObjectStore("requests", {
		keyPath: "id",
		autoIncrement: true
	});

	objectStore.createIndex("sessionName", "sessionName", { unique: false });
	objectStore.createIndex("pageTitle", "pageTitle", { unique: false });
	objectStore.createIndex("pageUrl", "pageUrl", { unique: false });
	objectStore.createIndex("requestUrl", "requestUrl", { unique: false });
	objectStore.createIndex("endpointName", "endpointName", { unique: false });
	objectStore.createIndex("queryParameterCount", "queryParameterCount", {
		unique: false
	});
	objectStore.createIndex("responseSize", "responseSize", { unique: false });
	objectStore.createIndex("responseFilename", "responseFilename", {
		unique: false
	});
};

request.onsuccess = (event) => {
	db = event.target.result;
};

// Function to store a captured request in IndexedDB
function storeRequest(capturedRequest) {
	const transaction = db.transaction(["requests"], "readwrite");
	const objectStore = transaction.objectStore("requests");

	// Convert capturedRequest to a blob
	const blob = new Blob([JSON.stringify(capturedRequest)], { type: "application/json" });


	const request = objectStore.add(blob);
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
		timeZone: "America/New_York"
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

// Intercept and log requests
self.addEventListener("fetch", (event) => {
	const { request } = event;

	// Modify this condition to match the specific website you want to intercept requests for
	if (request.url.includes("lepetitvapoteur.com")) {
		event.respondWith(handleRequest(request));
	}
});

function getEndpointName(url) {
  const urlObj = new URL(url);
  return urlObj.pathname.split("/").pop();
}


let sessionName, pageTitle, pageUrl;

// Handle the intercepted request
async function handleRequest(request) {
	const response = await fetch(request.clone());

	const capturedRequest = {
		headers: response.headers,
		payload: await request.text(),
		response: await response.text(),
		sessionName: sessionName,
		pageTitle: pageTitle,
		pageUrl: pageUrl,
		requestUrl: request.url,
		endpointName: getEndpointName(request.url),
		queryParameterCount: Object.keys(request.url.searchParams).length,
		responseSize: response.headers.get("content-length") || "",
		responseFilename: generateResponseFilename(capturedRequest);
	};

	// Store captured request in IndexedDB
	storeRequest(capturedRequest);

	return response;
}

// ... (previously defined code)

let sessionName;

self.addEventListener("message", (event) => {
	if (event.data.action === "startCapture") {
		capturing = true;
		sessionName = event.data.sessionName;
		pageTitle = event.data.sessionName;
		pageUrl = event.data.pageUrl;
		capturedRequests = [];
	} else if (event.data.action === "stopCapture") {
		capturing = false;
		storeCapturedRequests();
	} else if (event.data.action === "capturedRequest") {
		capturedRequests.push(event.data.capturedRequest);
	} else if (event.data.action === "downloadFile"){
		handleFileDownload(event.data.filename);
	}
});

