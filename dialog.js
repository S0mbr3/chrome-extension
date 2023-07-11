// Get references to HTML elements
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const requestLogTable = document.getElementById("request-log-table");

// Function to dynamically populate the table with captured requests
function populateRequestLogTable(requests) {
	const tbody = requestLogTable.getElementsByTagName("tbody")[0];
	tbody.innerHTML = ""; // Clear existing rows

	requests.forEach((request) => {
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

		tbody.appendChild(row);
	});
}

// Event listener for opening the modal dialog
chrome.browserAction.onClicked.addListener(() => {
	// Retrieve captured requests from IndexedDB
	const transaction = db.transaction(["requests"], "readonly");
	const objectStore = transaction.objectStore("requests");

	const getAllRequest = objectStore.getAll();
	getAllRequest.onsuccess = () => {
		const requests = getAllRequest.result;
		populateRequestLogTable(requests);

		// Show the modal dialog
		modal.style.display = "block";
	};
});

// Event listener for closing the modal dialog
span.onclick = () => {
	modal.style.display = "none";
};

// Close the modal dialog when the user clicks outside the dialog
window.onclick = (event) => {
	if (event.target === modal) {
		modal.style.display = "none";
	}
};

