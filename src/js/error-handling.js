(function($) {

	geochartjs.errorHandling = function(jsonResult, successCallback) {

		/* Error Handling
		 *
		 * You can execute the error handling with the following call
		 * in a module: kraken.errorHandling(returnedDataObject, callbackFunction);
		 * Pass the returned data object from the ajax call to this function
		 * If you need to execute some code after a successful error handling,
		 * you can wrap this code into a callback function and also pass it here.
		 *
		 */"use strict";

		if(typeof jsonResult !== "undefined" && jsonResult !== null) {
			if(jsonResult.hasOwnProperty("error")) {
				if(jsonResult.error.hasOwnProperty("title") && jsonResult.error.hasOwnProperty("message")) {
					showError(jsonResult.error.title, jsonResult.error.message);
				}
				else {
					showStandardMessage();
				}
			}
			else {
				if(typeof successCallback !== "undefined") {
					successCallback();
				}
			}
		}
		else {
			showNoDataMessage();
		}

		function showNoDataMessage() {
			var title = "No data received";
			var message = "While trying to get the data from the database, an error occured and no data was transferred to the webpage. Please reload this page again.";
			showError(title, message);
		}

		function showStandardMessage() {
			var title = "Error occured";
			var message = "An error occured during execution. Please reload this page.";
			showError(title, message);
		}

		function showError(title, message) {
			var $globalError = $("#globalError");
			$globalError.find(".title").text(title);
			$globalError.find(".message").text(message);
			$globalError.fadeIn("fast");
		}

	};

})(jQuery);