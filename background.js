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
