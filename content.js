// Message listener to intercept requests
chrome.runtime.sendMessage({
	action: "capturedRequest",
	capturedRequest: {
		headers: details.requestHeaders,
		payload: details.requestBody,
		response: details.responseBody,
		sessionName: "Your session name",
		pageTitle: document.title,
		pageUrl: document.URL,
		requestUrl: details.url,
		endpointName: "Your endpoint name",
		queryParameterCount: details.requestHeaders.length,
		responseSize: details.responseBody.length,
		responseFilename: "Your filename"
	}
});

// WebRequest event listener to intercept requests
chrome.webRequest.onBeforeRequest.addListener(
	(details) => {
		// ... (code to handle intercepted requests)
	},
	{ urls: ["<all_urls>"] },
	["requestBody"]
);

