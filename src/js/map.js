geochartjs.map = ( function($, d3, topojson, moment, utils, htmlTemplate) {

	"use strict";

	var properties = {
		container: ".geochart-map",
		zoomRange: [1, 9],
		mapName: "ne_50m_admin_0_countries",
		hasDataClass: "hasData",
		fullscreenClass: "fullscreen",
		notLocatableTitle: "Not Locatable",
		thresholdToSmallMap: 600,
		smallMapClass: "smallMap"
	};

	var mapList = [];
	var data = [];
	var format = {
		date: 'YYYY-MM-DD'
	};
	var style = {
		seaColor: "#B8D5EA",
		countryColorRangeStart: "rgb(182,218,195)",
		countryColorRangeEnd: "rgb(7,84,37)",
		countryColorNoData: "#efefef",
		countryStrokeColor: "#CCC",
		countryStrokeWidthMin: "0.07",
		countryStrokeWidthMax: "0.3",
		selectedCountryColor: "#FFE700",
		selectedCountryStrokeColor: "#000000"
	};
	var label = {
		mapListTitle: 'Data Distribution',
		configurationDataType: 'DATA TYPE',
		configurationColorFunction: 'COLOR FUNCTION',
		colorFunction: {
			log: 'Logarithmic',
			linear: 'Linear',
			quadratic: 'Quadratic',
			sqrt: 'Square Root',
			cubicroot: 'Cubic Root',
			neginverse: 'Negated Inverse'
		}
	};

	var colorRange = d3.scale.linear()
		.range([0,1]);
	var strokeRange = d3.scale.linear()
		.domain(properties.zoomRange)
		.range([style.countryStrokeWidthMax, style.countryStrokeWidthMin]);
	var svg;
	var group;
	var width;
	var height;
	var projection;
	var path;
	var currentMaximumValue = 0;
	var currentValueSum = 0;
	var zoom;
	var topo;
	var valueMappingFunction = Math.log;
	var mapJsonUrl;
	var dataJsonUrl;
	var resizeTimer;
	var fixedSize = false;
	var windowWidth;
	var tabScrollApi;
	var $scrollTabElement;

	var valueMappingFunctions = {
		log: function(n) {
			return Math.log(n);
		},
		linear: function(n) {
			return n;
		},
		quadratic: function(n) {
			return Math.pow(n, 2);
		},
		sqrt: function(n) {
			return Math.sqrt(n);
		},
		cubicroot: function(n) {
			return Math.pow(n, 1/3);
		},
		neginverse: function(n) {
			return -1/n + 1;
		}
	};

	var initialize = (function() {

		function initNoControls(configuration) {
			$(properties.container).addClass("noControls");
			initialize(configuration);
		}

		function init(configuration) {

			// this function checks to configuration input and handles it respectively.
			// it starts the map initialization when the mapData and the data is
			// returned by the ajax call or instantly, if it is directly passed in the
			// configuration object.

			checkAvailabilityOfjQueryLibraries();

			if(isObject(configuration.format)) {
				format = $.extend(true, format, configuration.format);
			}
			if(isObject(configuration.style)) {
				style = $.extend(true, style, configuration.style);
			}
			if(isObject(configuration.label)) {
				label = $.extend(true, label, configuration.label);
			}

			preInitialization();

			(function getMapDataAndContinueInitialization() {
				if(isString(configuration.map)) {
					d3.json(configuration.map, function(mapData) {
						getDataObjectAndContinueInitialization(mapData);
					});
				}
				else if(isObject(configuration.map)) {
					getDataObjectAndContinueInitialization(configuration.map);
				}
				else {
					throw "'geochart.js' needs a valid input map";
				}
			})();

			function getDataObjectAndContinueInitialization(mapData) {
				if(isString(configuration.data)) {
					d3.json(configuration.data, function(config) {
						data = config.data;
						initialization(mapData);
					});
				}
				else if(isObject(configuration.data)) {
					data = configuration.data;
					initialization(mapData);
				}
				else {
					throw "'geochart.js' needs a valid data object";
				}
			}

			postInitialization();
		}

		function checkAvailabilityOfjQueryLibraries() {
			function check(library) {
				if(!isset(library.lib)) {
					throw 'LibraryMissingError: '+library.name+' is missing.';
				}
			}
			check({lib: $(document).loadTemplate, name: 'jQuery loadTemplate'});
			check({lib: $(document).jScrollPane, name: 'jQuery jScrollPane'});
		}

		function preInitialization() {
			createDomStructure();
			setLabelTexts();
			setupMap();
			makeMapResizable();
		}

		function initialization(mapData) {
			topo = topojson.feature(mapData, mapData.objects[properties.mapName]);

			(function slideMenuMetaData() {
				addCSVLink();
				setDateStamp();
			})();

			(function setupSlideMenuList() {
				adaptColorParameters();
				fillMapList();
				addScrollingToList();
			})();

			(function tabSwitchingBehavior() {
				addMapListTabs();
				addScrollingToTabs();
				fillDataTypeSelectButtonWithEntries();
				initialSelectionOfDataTypeInGui();
				addClickListenerToDataTypeTabButtons();
			})();

			(function mapBehavior() {
				topo = mergeData(topo);
				displayMap();
			})();
		}

		function postInitialization() {
			addClickListenerToZoomButtons();
			addClickListenerToFullScreenButtons();
			addClickListenerToListButtons();
			addClickListenerToSettingsButton();
			addChangeListenerToFunctionSelect();
			addChangeListenerToDataTypeSelectBox();
		}

		return {
			init: init,
			initNoControls: initNoControls
		};

	})();

	function createDomStructure() {
		$(htmlTemplate.overlays).appendTo(properties.container);
		$(htmlTemplate.templates).appendTo('body');
	}

	function setLabelTexts() {
		$('.slide-menu .menu h2 .title').text(label.mapListTitle);
		$('.functionSelectWrapper .selectLabel').text(label.configurationColorFunction);
		$('.dataTypeSelectWrapper .selectLabel').text(label.configurationDataType);
		$('.button.functionSelect').find('option').text(function() {
			return label.colorFunction[$(this).val()];
		});
	}

	function addCSVLink() {
		var $button = $('.list .csvDownload');
		if(isset(data.csv)) {
			$button.attr('href', data.csv);
		}
		else {
			$button.remove();
		}
	}

	function setDateStamp() {
		var formattedDate = moment(data.date.value, data.date.format).format(format.date);
		$(properties.container + " .slide-menu h2 .date").text("("+formattedDate+")");
	}

	function setupMap() {
		svg = d3.select(properties.container).append("svg").style('background', style.seaColor);
		projection = d3.geo.equirectangular();

		if(isInFullscreen()) {
			height = $(properties.container).height();
			width = height * 2;

			svg.attr({width: $(properties.container).width(), height: $(properties.container).height()});
			projection.translate([(width/2), (height/2)]).scale(width/2/Math.PI);
		}
		else {
			width = $(properties.container).width();
			height = width / 2;

			svg.attr({width: width, height: height});
			projection.translate([(width/2), (height/2)]).scale(width/2/Math.PI);
		}

		$(properties.container).removeClass(properties.smallMapClass);
		if(width < properties.thresholdToSmallMap) {
			$(properties.container).addClass(properties.smallMapClass);
		}

		path = d3.geo.path().projection(projection);
		zoom = d3.behavior.zoom().scaleExtent(properties.zoomRange).on("zoom", move);

		group = svg.append("g").style("opacity", 0);
		svg.call(zoom).call(zoom.event).on("click", preventClickingWhileDragging, true);

		function preventClickingWhileDragging() {
			// example from http://bl.ocks.org/mbostock/9656675
			if (d3.event.defaultPrevented) {
				d3.event.stopPropagation();
			}
		}

		windowWidth = $(window).width();
	}


	function makeMapResizable() {
		d3.select(window).on("resize", function() {
			var isFullscreen = $(properties.container).is("."+properties.fullscreenClass);
			var windowWidthChanged = windowWidth !== $(window).width();

			if(!(fixedSize && !isFullscreen) && (isFullscreen || windowWidthChanged)) {
				windowWidth = $(window).width();
				window.clearTimeout(resizeTimer);
				d3.select(properties.container + " .overlay").transition().duration(200).style("opacity", 0);
				$(properties.container + " .single-country-info").hide();
				timedRedraw();
			}
		});
	}

	function timedRedraw() {
		resizeTimer = window.setTimeout(function() {
			redraw();
		}, 300);
	}

	function redraw() {
		svg.remove();
		setupMap();
		selectCountryOnMapList(undefined);
		displayMap();
	}

	function setColorRangeDomain() {
		colorRange.domain([0, valueMappingFunction(currentMaximumValue)]);
	}

	function setCurrentMaximumValueAndSum() {
		var countryArray = getCountriesInArray();
		currentValueSum = 0;
		currentMaximumValue = d3.max(countryArray, function(country) {
			if(isset(country.values[data.selectedType])) {
				var value = parseFloat(country.values[data.selectedType], 10);
				currentValueSum += value;
				return value;
			}
			return 0;
		});
	}

	function mergeData(topo) {
		var countryArray = getCountriesInArray();

		for(var i=0; i<countryArray.length; i++) {
			var codeMatch = false;

			for(var j=0; j < topo.features.length; j++) {
				var mapCountryCode = topo.features[j].properties.iso_a2;
				if(countryArray[i].code === mapCountryCode) {
					var countryInformation = countryArray[i];
					topo.features[j].properties.country = countryInformation;
					codeMatch = true;
				}
			}
		}
		return topo;
	}

	function fillMapList() {
		fillMapListInData();
		fillMapListInGui();
	}

	function fillMapListInData() {
		mapList = [];

		var countryArray = getCountriesInArray();
		for(var i=0; i<countryArray.length; i++) {
			var country = countryArray[i];

			if(isset(country.values[data.selectedType])) {
				mapList.push({
					code: country.code,
					label: country.label,
					continent: country.continent,
					value: country.values[data.selectedType],
					percent: formatPercent(country.values[data.selectedType] / currentValueSum)
				});
			}
		}

		function sortMapList(firstCountry, secondCountry) {
			var firstValue = firstCountry.value;
			var secondValue = secondCountry.value;

			return ((firstValue > secondValue) ? -1 : ((firstValue < secondValue) ? 1 : 0));
		}

		mapList.sort(sortMapList);

		for(var j=0; j<mapList.length; j++) {
			mapList[j].ranking = j+1;
		}
	}

	function formatPercent(percent) {
		return Math.round(percent*100 * 1000)/1000+'%';
	}

	function fillMapListInGui() {
		var $mapList = $(properties.container + " .slide-menu .list table tbody");
		$mapList.empty();
		$mapList.loadTemplate($("#slide-menu-table-template"), mapList);
	}

	function addMapListTabs() {
		$('.data-type-chooser .scroll-pane').loadTemplate($("#data-type-chooser-template"), data.types).find('span');
	}

	function addChangeListenerToDataTypeSelectBox() {
		$('.button.dataTypeSelect').change(function() {
			var type = $(this).find('option:selected').val();
			selectDataType(type);
		});
	}
	function addClickListenerToDataTypeTabButtons() {
		var $tabs = $('.data-type-chooser .tab');
		$tabs.click(function() {
			if(!$(this).hasClass('active')) {
				var type = $(this).data('type');
				$('.button.dataTypeSelect').val(type);
				tabScrollApi.scrollToX($(this).position().left-30);
				selectDataType(type);
			}
		});
	}

	function initialSelectionOfDataTypeInGui() {
		$('.button.dataTypeSelect').val(data.selectedType);
		$('.data-type-chooser .tab[data-type='+data.selectedType+']').addClass('active');
	}

	function selectDataType(type) {
		data.selectedType = type;

		adaptColorParameters();

		adjustTabsToSelectedType();
		$('.single-country-info').fadeOut();
		fillMapList();
		adaptMapToNewDataTypeOrColorFunction();
	}

	function adaptMapToNewDataTypeOrColorFunction() {
		group.selectAll("path")
		.style("fill", addBackgroundColor)
		.style("cursor", setPointerCursor)
		.style("stroke", addStrokeColor)
		.on("click", clickHandler);

		moveNoDataPathStrokesToTheBackground();
	}

	function adjustTabsToSelectedType() {
		$scrollTabElement = $('.data-type-chooser .tab[data-type='+data.selectedType+']');

		var $tabs = $('.data-type-chooser .tab');
		$tabs.removeClass('active');
		$tabs.filter('[data-type='+data.selectedType+']').addClass('active');
	}

	function displayMap() {
		group.selectAll("path")
		.data(topo.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", addBackgroundColor)
		.style("stroke-width", style.countryStrokeWidthMax+"px")
		.style("stroke", addStrokeColor)
		.style("cursor", setPointerCursor)
		.on("click", clickHandler);

		moveNoDataPathStrokesToTheBackground();
		group.transition().duration(700).style("opacity", 1);
		$('.spinner').fadeOut("fast");
		$('.overlay').fadeIn(700);
		d3.select(properties.container + " .overlay").transition().duration(700).style("opacity", 1);
	}

	function moveNoDataPathStrokesToTheBackground() {
		group.selectAll("path").each(function(datum) {
			if(!hasCountryDataForSelectedType(datum)) {
				var parent = $(this).parent()[0];
				var firstChildOfParent = $(parent).children().first()[0];
				parent.insertBefore(this, firstChildOfParent);
			}
		});
	}

	function setPointerCursor(datum) {
		if(hasCountryDataForSelectedType(datum)) {
			return "pointer";
		}
	}

	function addBackgroundColor(datum) {
		if(hasCountryDataForSelectedType(datum)) {
			var code = datum.properties.country.code;
			var color = getColor(datum);
			addMapListRankingBackgroundColor(code, color);
			return getColor(datum);
		}
		else {
			return style.countryColorNoData;
		}
	}

	function addMapListRankingBackgroundColor(countryCode, color) {
		$('.slide-menu .list')
		.find('table tr[data-country-code='+countryCode+']')
		.find('.ranking')
		.css('backgroundColor', color);
	}

	function addStrokeColor(datum) {
		if(hasCountryDataForSelectedType(datum)) {
			return getStrokeColor(datum);
		}
		else {
			return style.countryStrokeColor;
		}
	}

	function clickHandler(datum) {
		/*jshint validthis:true */
		var selectedCountryColorString = d3.rgb(style.selectedCountryColor).toString();
		var currentCountryColorString = d3.rgb(d3.select(this).style("fill")).toString();
		var isAlreadySelected = selectedCountryColorString === currentCountryColorString;

		if(hasCountryDataForSelectedType(datum) && !isAlreadySelected) {
			group.selectAll("path").style("fill", addBackgroundColor).style("stroke", addStrokeColor);
			d3.select(this.parentNode.appendChild(this)).transition().style({
				"fill": style.selectedCountryColor,
				"stroke": style.selectedCountryStrokeColor
			});
			addAndShowSingleCountryInfo(datum);
			selectCountryOnMapList(datum);
		}
	}

	function addAndShowSingleCountryInfo(datum) {
		var country = datum.properties.country;
		var singleInformation = {
			countryLabel: country.label,
			continent: country.continent,
			dataType: getLabelByType(data.selectedType),
			value: country.values[data.selectedType],
			percent: formatPercent(country.values[data.selectedType] / currentValueSum)
		};

		$('.single-country-info').fadeIn();
		$('.single-country-info').loadTemplate($("#single-country-info-template"), singleInformation);
	}

	function getLabelByType(type) {
		for(var i=0; i<data.types.length; i++) {
			if(data.types[i].type === type) {
				return data.types[i].label;
			}
		}
		return "";
	}

	function selectCountryOnMapList(datum) {
		var $list = $(properties.container + ' .slide-menu .list');
		var $row = $list.find('table tbody tr');
		$row.removeClass('selected');

		if(isset(datum)) {
			var countryCode = datum.properties.iso_a2;

			$row.each(function() {
				if($(this).data("country-code") === countryCode) {
					$(this).addClass("selected");
					$(this).find('.ranking').css('backgroundColor', style.selectedCountryColor);
				}
			});
		}
	}

	function move() {
		if(d3.event.scale < 1) {
			d3.event.scale = 1;
		}
		var translate = d3.event.translate;
		var scale = d3.event.scale;

		translate = stopTranslateOnViewportBorders(translate, scale);
		adaptZoomButtonDisableColor(scale);

		group.selectAll("path").style("stroke-width", strokeRange(scale)+"px");
		group.attr("transform", "translate(" + translate + ")scale(" + scale + ")");

		zoom.translate(translate);
		zoom.scale(scale);
	}

	function addClickListenerToZoomButtons() {
		$(properties.container + " .zoom-plus").click(function() {
			zoomMap.apply(this, [{zoomIn: true}]);
		});
		$(properties.container + " .zoom-minus").click(function() {
			zoomMap.apply(this, [{zoomIn: false}]);
		});

		function zoomMap(object) {
			/*jshint validthis:true */
			var activatedButton = !$(this).hasClass("inactive");
			var objectIsValid = object.zoomIn === true || object.zoomIn === false;

			if(activatedButton && objectIsValid) {
				var scaleBefore = zoom.scale();
				var translateBefore = zoom.translate();
				var centerBefore = [(translateBefore[0] - (width/2)), (translateBefore[1] - (height/2))];
				var scale = object.zoomIn ? Math.round(scaleBefore + 1) : Math.round(scaleBefore - 1);
				var center = [(centerBefore[0] / scaleBefore) * scale, (centerBefore[1] / scaleBefore) * scale];
				var translate = [center[0] + (width/2), center[1] + (height/2)];

				translate = stopTranslateOnViewportBorders(translate, scale);

				if(scale >= properties.zoomRange[0] && scale <= properties.zoomRange[1]) {
					svg.transition().duration(100).call(zoom.scale(scale).translate(translate).event);
				}
				else if(scale > properties.zoomRange[1]) {
					svg.transition().duration(100).call(zoom.scale(properties.zoomRange[1]).translate(translate).event);
				}
				else {
					svg.transition().duration(100).call(zoom.scale(properties.zoomRange[0]).translate(translate).event);
				}
			}
		}
	}

	function addClickListenerToFullScreenButtons() {
		$(properties.container + " .fullscreen-open").click(enterFullscreen);
		$(properties.container + " .fullscreen-close").click(closeFullscreen);
	}

	function enterFullscreen() {
		/* jshint validthis: true */
		if($(this).is(":not(:hidden)")) {

			(function makeFullscreen($element) {
				var elem = $element[0];

				if (elem.requestFullscreen) {
					elem.requestFullscreen();
				}
				else if (elem.msRequestFullscreen) {
					elem.msRequestFullscreen();
				}
				else if (elem.mozRequestFullScreen) {
					elem.mozRequestFullScreen();
				}
				else if (elem.webkitRequestFullscreen) {
					elem.webkitRequestFullscreen();
				}
			})($(properties.container));

			$(properties.container).addClass(properties.fullscreenClass);
			$("html").css({"overflow": "hidden"});
			$(properties.container + " .single-country-info").fadeOut();
			$(this).fadeOut();
			$(properties.container + " .fullscreen-close").fadeIn();
			addScrollingToList();
			timedRedraw();
		}
	}

	function closeFullscreen() {
		/* jshint validthis: true */
		if($(this).is(":not(:hidden)")) {

			(function exitFullscreen() {
				if(document.exitFullscreen) {
					document.exitFullscreen();
				}
				else if(document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				}
				else if(document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				}
			})();

			$(properties.container).removeClass(properties.fullscreenClass);
			$("html").css({"overflow": "visible"});
			$(properties.container + " .single-country-info").fadeOut();
			$(this).fadeOut();
			$(properties.container + " .fullscreen-open").fadeIn();
			timedRedraw();
			addScrollingToList();
		}
	}

	function addClickListenerToListButtons() {
		var $list = $(properties.container + " .slide-menu .menu");
		var $showButton = $(properties.container + " .show-slide-menu-button");
		var $hideArea = $(properties.container + " .hide-slide-menu-area");

		$showButton.click(function() {
			$list.animate({"left": 0});
			$showButton.fadeOut();
			$hideArea.fadeIn();
			if(typeof $scrollTabElement !== 'undefined') {
				tabScrollApi.scrollToX($scrollTabElement.position().left-30);
			}
		});
		$hideArea.click(function() {
			$list.animate({"left": - ($list.outerWidth() + 20)});
			$showButton.fadeIn();
			$hideArea.fadeOut();
		});
	}

	function addChangeListenerToFunctionSelect() {
		$(".button.functionSelect").change(function() {
			valueMappingFunction = valueMappingFunctions[$(this).find("option:selected").val()];
			$('.single-country-info').fadeOut();

			adaptColorParameters();
			adaptMapToNewDataTypeOrColorFunction();
			$('.slide-menu .list').find('tr').removeClass('selected').find('.ranking').removeAttr('style');
		});
	}

	function adaptColorParameters() {
		setCurrentMaximumValueAndSum();
		setColorRangeDomain();
	}

	function addScrollingToList() {
		$('.list .scroll-pane').jScrollPane({ verticalDragMinHeight: 70 });
	}

	function addScrollingToTabs() {
		var $tabs = $('.data-type-chooser');
		var $scrollPane = $tabs.find('.scroll-pane');

		tabScrollApi = $scrollPane.jScrollPane({
			showArrows: true,
			animateScroll: true,
			speed: 200
		}).data('jsp');

		adjustTabsToSelectedType();
	}

	function addClickListenerToSettingsButton() {
		$('.button.settings').click(function() {
			var $regularIcon = $(this).find('.icon-settings');
			var $hideIcon = $(this).find('.icon-settings-hide');

			if($(this).hasClass('shown')) {
				$(this).removeClass('shown');
				$(this).animate({ bottom: 10 }, "fast");
				$('.settingsWrapper').animate({ bottom: -55 }, "fast");
				$hideIcon.fadeOut("fast");
				$regularIcon.fadeIn("fast");
			}
			else {
				$(this).addClass('shown');
				$(this).animate({ bottom: 50 }, "fast");
				$('.settingsWrapper').animate({ bottom: 10 }, "fast");
				$hideIcon.fadeIn("fast");
				$regularIcon.fadeOut("fast");
			}
		});
	}

	function fillDataTypeSelectButtonWithEntries() {
		$('select.dataTypeSelect').loadTemplate($("#data-type-chooser-select-template"), data.types);
	}

	function stopTranslateOnViewportBorders(translate, scale) {
		// example on http://techslides.com/d3-map-starter-kit/
		if(isInFullscreen()) {
			var borderRight = ($(properties.container).width() - width) * (scale) - $(properties.container).width() * (scale-1);
			translate[0] = Math.min(0, Math.max(borderRight, translate[0]));
		}
		else {
			translate[0] = Math.min(0, Math.max(width * (1 - scale), translate[0]));
		}
		translate[1] = Math.min(0, Math.max(height * (1 - scale), translate[1]));
		return translate;
	}

	function adaptZoomButtonDisableColor(scale) {
		var inaccuracyBuffer = 0.05;

		if(scale < properties.zoomRange[0] + inaccuracyBuffer) {
			$(properties.container + " .zoom-minus").addClass("inactive");
			$(properties.container + " .zoom-plus").removeClass("inactive");
		}
		else if(scale > properties.zoomRange[1] - inaccuracyBuffer) {
			$(properties.container + " .zoom-plus").addClass("inactive");
			$(properties.container + " .zoom-minus").removeClass("inactive");
		}
		else {
			$(properties.container + " .zoom-plus").removeClass("inactive");
			$(properties.container + " .zoom-minus").removeClass("inactive");
		}
	}

	function hasCountryDataForSelectedType(datum) {
		if(isset(datum.properties.country)) {
			return isset(datum.properties.country.values[data.selectedType]);
		}
		return false;
	}
	function getPercentageBetweenUpperAndLowerColor(datum) {
		var value = datum.properties.country.values[data.selectedType];
		var valueMapped = valueMappingFunction(value);
		return colorRange(valueMapped);
	}
	function getColor(datum) {
		var percentValueBetweenUpperAndLowerColor = getPercentageBetweenUpperAndLowerColor(datum);
		var interpolationFunction = d3.interpolateRgb(style.countryColorRangeStart, style.countryColorRangeEnd);
		return interpolationFunction(percentValueBetweenUpperAndLowerColor);
	}
	function getStrokeColor(datum) {
		return d3.rgb(getColor(datum)).darker().toString();
	}
	function isInFullscreen() {
		return $(properties.container).hasClass(properties.fullscreenClass);
	}

	function makeFixedSize() {
		fixedSize = true;
	}

	function isset(variable) {
		return typeof variable !== 'undefined';
	}

	function isObject(variable) {
		return typeof variable === Object || typeof variable === 'object';
	}

	function isString(variable) {
		return typeof variable === String || typeof variable === 'string';
	}

	function getCountriesInArray() {

		// the data object holds an object with countries in it.
		// for the purpose of this map, it is easier to iterate over
		// an array list of countries. therefore it is mapped here.
		// please note that the country code is now stored as 'code'.

		var array = [];
		for(var key in data.countries) {
			if(data.countries.hasOwnProperty(key)) {
				var object = data.countries[key];
				array.push($.extend(true, {}, object, {code: key}));
			}
		}
		return array;
	}

	return {
		init: initialize.init,
		initNoControls: initialize.initNoControls,
		makeFixedSize: makeFixedSize
	};

}(jQuery, d3, topojson, moment, geochartjs.utils, geochartjs.htmlTemplate));