	window.geochart = {
		version: version,
		init: initialize.init,
		makeFixedSize: makeFixedSize,
		destroy: destroy
	};

})(window, jQuery, d3, topojson, moment);