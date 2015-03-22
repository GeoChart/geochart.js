# :chart_with_upwards_trend: geochart.js [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

> A geo location based visualization chart application based on D3.js, TopoJSON and jQuery. It provides a simple interface for visualizing a dataset on a chloropleth world map.

## Getting Started
You can find an example of the geochart library on this link: [geochart.js](http://rawgit.com/ssc-hrep3/geochart.js/master/dist/example/index.html). This example is deposited in the `dist/example/` folder.

At the moment, it is not possible to check out this project as a bower project. Feel free to copy the files in the dist folder to your project and include it manually. The `geochart.js` library has some dependencies. It is necessary to include these dependencies before the `geochart.js` library. Take a look at the `bower.json` file to find out which libraries are necessary.

## Options
geochart.js expects a configuration object as an initial input. In the following section the mandatory and optional options are described in detail.

### options.bindTo
* Type: `String`
* Mandatory: :negative_squared_cross_mark:
* Default value: `'#geochart-map'`

The element to which the map is bound to. This is **not** a regular selector. Only class names or id names are allowed. The `.` or `#` in the beginning indicate the type (class or id). If no type indicator is given, an id is assumed. This value does neither allow selectors which are traversing the DOM, nor pure HTML elements or special selectors. It is recommended to use a unique id. The element can be only available once in the DOM. If it is not present yet, it will be appended to the `body` of the document.

### options.map
* Type: `String` or `Object`
* Mandatory: :ballot_box_with_check:
* Default value: `undefined`

The URL path to the json file containing the map data or the object itself. This option is necessary and can be provided as a link or a TopoJSON JavaScript object. Each country of the TopoJSON needs to provide a properties object with a key `iso_a2`. The value of it is a country code according to [ISO 3166-1 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).

### options.data
* Type: `String` or `Object`
* Mandatory: :ballot_box_with_check:
* Default value: `undefined`

The URL path to the data json or the object itself containing all the data which needs to be viualized on the map. If an URL is specified, the URL needs to provide a JSON with an object with one key `data`. This object equals the object, which can passed here directly.

#### options.data.types
* Type: `Array` of `Object`
* Mandatory: :ballot_box_with_check:
* Default value: `undefined`

An array of data types in which the values are grouped. Each data type holds a set of values which are displayed in separate maps. The data type can easily be switched in the slide menu or the overlayed select box. The structure of each object needs to correspond to the following structure  (whereas the `unit` is optional):
```
{
  "type": "DATA_TYPE_KEY",
  "label": "Data Type",
  "unit": "°F"
}
```

#### options.data.selectedType
* Type: `String`
* Mandatory: :negative_squared_cross_mark:
* Default value: the first defined data type

The key of the initially selected data type. If not specified, the first data type from the array of data types is taken.

#### options.data.countries
* Type: `Object`
* Mandatory: :ballot_box_with_check:
* Default value: `undefined`

The object holding the data of each country, which needs to be visualized. The key of every country is the [ISO 3166-1 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code, which is used to match the data with the actual map. Its structure is depicted in the following example:
```
options.data.countries = {
  "US": {
    "label": "United States",
    "continent": "North America",
    "values": {
      [...]
    }
  }
}
```
##### options.data.countries.label
* Type: `String`
* Mandatory: :negative_squared_cross_mark:
* Default value: 2-character country code

##### options.data.countries.continent
* Type: `String`
* Mandatory: :negative_squared_cross_mark:
* Default value: `undefined`

##### options.data.countries.values
* Type: `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: `undefined`

Lists all values for each data type of this specific country. If `values` is not provided, this specific country entry becomes obsolete and is not used inside the map. Not every listed country needs to provide a value for each data type. The structure of the object needs to be like in the following example:

```
options.data.countries.US.values = {
  "DATA_TYPE_KEY_1": 123,
  "DATA_TYPE_KEY_2": 456,
  [...]
}
```

#### options.data.notLocatable
* Type: `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: `undefined`

Often there are datasets which can not be located to a single country but need to be declared anyway. This option adds the not locatable data sets to only the slide menu, not the map. The structure of the `Object` is equal to a [regular country entry](#optionsdatacountries) with exception of the continent, which can not be provided.

#### options.data.csv
* Type: `String`
* Mandatory: :negative_squared_cross_mark:
* Default value: `undefined`

The URL path to the CSV file which holds the full dataset. If a link is provided, it will show a button in the slide menu leading to the provided link.

#### options.data.date
* Type: `String` or `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: `undefined`

The date of the dataset, which is displayed on top of the slide menu. By default, the date needs to be given in the format YYYY-MM-DD. If the input format needs to be passed too, the following schema can be used. The input date format needs to match the requirements of a format string of [moment.js](http://momentjs.com/).

```
options.data.date = {
  "value": "01.01.2015",
  "format": "DD.MM.YYYY"
}
```

### options.format
* Type: `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: *see subsection*

#### options.format.date
* Type: `String`
* Mandatory: :negated_squared_cross_mark:
* Default value: `'YYYY-MM-DD'`

The output format for the date, if it is set in [`options.data.date`](#optionsdatadate). The output date format needs to match the requirements of a format string of [moment.js](http://momentjs.com/).

### options.label
* Type: `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: *see table*

The labels used on the map can be configured easily. All of the values have a default value and therefore do not have to be redefined. Take a look at the following table to configure your individual labels.

| Key                                        | Default Value     |
| ------------------------------------------ |------------------ |
| `options.label.mapListTite`                | Data Distribution |
| `options.label.configurationDataType`      | DATA TYPE         |
| `options.label.configurationColorFunction` | COLOR FUNCTION    |
| `options.label.colorFunction.log`          | Logarithmic       |
| `options.label.colorFunction.linear`       | Linear            |
| `options.label.colorFunction.quadratic`    | Quadratic         |
| `options.label.colorFunction.sqrt`         | Square Root       |
| `options.label.colorFunction.cubicroot`    | Cubic Root        |

### options.style
* Type: `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: *see table*

The styles of the map can be configured easily. All of the values have a default value and therefore do not have to be redefined. Take a look at the following table to configure your individual styles.

| Key                                        | Type         | Default Value    |
| ------------------------------------------ | ------------ | ---------------- |
| `options.style.seaColor`                   | Color String | #B8D5EA          |
| `options.style.countryColorRangeStart`     | Color String | rgb(182,218,195) |
| `options.style.countryColorRangeEnd`       | Color String | rgb(7,84,37)     |
| `options.style.countryColorNoData`         | Color String | #efefef          |
| `options.style.countryStrokeColor`         | Color String | #CCC             |
| `options.style.countryStrokeWidthMin`      | Number [0,1] | 0.07             |
| `options.style.countryStrokeWidthMax`      | Number [0,1] | 0.3              |
| `options.style.selectedCountryColor`       | Color String | #FFE700          |
| `options.style.selectedCountryStrokeColor` | Color String | #000             |

### options.properties
* Type: `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: *see subsection*

#### options.properties.mapName
* Type: `String`
* Mandatory: :negative_squared_cross_mark:
* Default value: `'geochart-world-map'`

This value is used only to specify the TopoJSON object name of the given TopoJSON map. See [the specification of TopoJSON](https://github.com/topojson/topojson-specification#2-topojson-objects) for more information.

#### options.properties.zoomRange
* Type: `Array` of 2 `Number`s
* Mandatory: :negative_squared_cross_mark:
* Default value: `[1, 9]`

Sets the zoom range to an individual range. The first number needs to be 1 and the second number needs to be greater than 1.

#### options.properties.fullscreen
* Type: `Boolean`
* Mandatory: :negative_squared_cross_mark:
* Default value: `true`

Allows to hide all fullscreen functionality.

#### options.properties.noControls
* Type: `Object`
* Mandatory: :negative_squared_cross_mark:
* Default value: *see subsection*

##### options.properties.noControls.inGeneral
* Type: `Boolean`
* Mandatory: :negative_squared_cross_mark:
* Default value: `false`

Hides all controls of the map, including the configuration, slide-menu, zooming and fullscreen. It does not allow the user to switch anymore between the various data types. The first selected data type will be the final data type, which is presented.

##### options.properties.noControls.inSmallMap
* Type: `Boolean`
* Mandatory: :negative_squared_cross_mark:
* Default value: `true`

Hides all controls of the map, similar to the previous option. The main difference is, that the controls are only invisible, if the container is smaller than a defined threshold. The container can not display the buttons anymore, if there is not enough space on the map anymore. Therefore, by default, the map hides the controls on a small map.

##### options.properties.noControls.smallMapThreshold
* Type: `Number` in Pixel
* Mandatory: :negative_squared_cross_mark:
* Default value: `600`

Defines the threshold in pixel from where below the map is classified as a small map and therefore the map controls are hidden. This option is only reasonable if `inSmallMap` is set to `true`.

## Map Generation (TopoJSON)
The default map of this framework is a cultural, medium scale world map from [naturalearthdata.com](http://www.naturalearthdata.com). It has been converted from the shape data with the [TopoJSON command-line tool](https://github.com/mbostock/topojson/wiki/Command-Line-Reference). One single property remained in the data: the [ISO 3166-1 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code of a country. This is needed for matching the map data with the to be presented data.
If you like to present your own map data, you need to provide a TopoJSON map with a country code stored in the properties of the map. The key a country code needs to be named: `'iso_a2'`. For converting a map in the format of shape data (like on naturalearthdata.com) to the required TopoJSON format, you can use the following shell command:
```
$ topojson -o map.json -p iso_a2 map.shp
```
