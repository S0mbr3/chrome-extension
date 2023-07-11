navigator.serviceWorker.register("service-worker.js");

document.addEventListener("DOMContentLoaded", () => {
	const sessionNameInput = document.getElementById("session-name");
	const startCaptureButton = document.getElementById("start-capture");
	const stopCaptureButton = document.getElementById("stop-capture");
	const requestTable = document.getElementById("request-table");

	let capturing = false;

	startCaptureButton.addEventListener("click", () => {
		const sessionName = sessionNameInput.value.trim();
		if (sessionName !== "") {
			capturing = true;
			startCaptureButton.disabled = true;
			stopCaptureButton.disabled = false;
			chrome.runtime.sendMessage({ action: "startCapture" });
		}
	});

	stopCaptureButton.addEventListener("click", () => {
		capturing = false;
		startCaptureButton.disabled = false;
		stopCaptureButton.disabled = true;
		chrome.runtime.sendMessage({ action: "stopCapture" });
	});

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === "capturedRequest") {
			if (capturing) {
				const capturedRequest = message.capturedRequest;
				const row = requestTable.insertRow(-1);
				const sessionNameCell = row.insertCell(0);
				const pageTitleCell = row.insertCell(1);
				const pageUrlCell = row.insertCell(2);
				const requestUrlCell = row.insertCell(3);
				const endpointNameCell = row.insertCell(4);
				const queryParameterCountCell = row.insertCell(5);
				const responseSizeCell = row.insertCell(6);
				const responseFilenameCell = row.insertCell(7);

				sessionNameCell.textContent = capturedRequest.sessionName;
				pageTitleCell.textContent = capturedRequest.pageTitle;
				pageUrlCell.textContent = capturedRequest.pageUrl;
				requestUrlCell.textContent = capturedRequest.requestUrl;
				endpointNameCell.textContent = capturedRequest.endpointName;
				queryParameterCountCell.textContent = capturedRequest.queryParameterCount;
				responseSizeCell.textContent = capturedRequest.responseSize;
				responseFilenameCell.innerHTML = `<a href="#" class="response-filename">${capturedRequest.responseFilename}</a>`;

				const responseFilenameLink = responseFilenameCell.querySelector(".response-filename");
				responseFilenameLink.addEventListener("click", (event) => {
					event.preventDefault();
					chrome.runtime.sendMessage({ action: "downloadFile", filename: capturedRequest.responseFilename });
				});
			}
		}
	});
});

