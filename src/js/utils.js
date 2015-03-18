geochartjs.utils = ( function() {

	"use strict";

	return {
		formatNumber: function(x) {
			// source: http://stackoverflow.com/a/2901298
			var parts = x.toString().split(".");
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
			return parts.join(".");
		},
		retrieveGetArgumentsFromUrl: function() {
			var args = window.location.search.substr(1);
			var argsSplited = args.split("&");
			var object = {};
			for(var i=0; i<argsSplited.length; i++) {
				var temparray = argsSplited[i].split("=");
				if(temparray[0] !== "undefined" && temparray[0] !== null) {
					object[temparray[0]] = temparray[1];
				}
			}
			return object;
		}
	};

}());
