// Get references to UI elements
const sessionNameInput = document.getElementById("session-name");
const startCaptureButton = document.getElementById("start-capture");
const stopCaptureButton = document.getElementById("stop-capture");
const requestTable = document.getElementById("request-table");

// Variable to store the captured requests
let capturedRequests = [];

// Function to update the UI with the captured requests
function updateRequestTable() {
	// Clear the table
	requestTable.innerHTML = `
	<tr>
	      <th>Session Name</th>
		    <th>Page Title</th>
			  <th>Page URL</th>
				<th>Request URL</th>
				      <th>Endpoint Name</th>
					    <th>Query Parameter Count</th>
						  <th>Response Size (bytes)</th>
							<th>Response Filename</th>
							    </tr>`;

	// Populate the table with captured requests
	capturedRequests.forEach((request) => {
		const row = document.createElement("tr");
		row.innerHTML = `
									      <td>${request.sessionName}</td>
										    <td>${request.pageTitle}</td>
											  <td>${request.pageUrl}</td>
												<td>${request.requestUrl}</td>
												      <td>${request.endpointName}</td>
													    <td>${request.queryParameterCount}</td>
														  <td>${request.responseSize}</td>
															<td><a href="${request.responseFilename}" download>${request.responseFilename}</a></td>`;

		requestTable.appendChild(row);
	});
}

// Function to send messages to the background script
function sendMessageToBackgroundScript(message, callback) {
	chrome.runtime.sendMessage(message, (response) => {
		if (callback && typeof callback === "function") {
			callback(response);
		}
	});
}

// Function to handle the start capture button click
function startCapture() {
	const sessionName = sessionNameInput.value.trim();
	if (sessionName === "") {
		alert("Please enter a session name.");
		return;
	}

	// Send message to the background script to start the capture
	sendMessageToBackgroundScript({ action: "startCapture" }, (response) => {
		if (response.success) {
			// Clear previous captured requests
			capturedRequests = [];
			updateRequestTable();

			// Disable start capture button and enable stop capture button
			startCaptureButton.disabled = true;
			stopCaptureButton.disabled = false;
		}
	});
}

// Function to handle the stop capture button click
function stopCapture() {
	// Send message to the background script to stop the capture
	sendMessageToBackgroundScript({ action: "stopCapture" }, (response) => {
		if (response.success) {
			// Store the captured requests
			capturedRequests = response.capturedRequests || [];
			updateRequestTable();

			// Disable stop capture button and enable start capture button
			stopCaptureButton.disabled = true;
			startCaptureButton.disabled = false;
		}
	});
}

// Add event listeners to the buttons
startCaptureButton.addEventListener("click", startCapture);
stopCaptureButton.addEventListener("click", stopCapture);
