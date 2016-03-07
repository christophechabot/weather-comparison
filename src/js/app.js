'use strict';

// Weather icons
// http://www.alessioatzeni.com/meteocons/
// Table of correspondance

var meteo_icons = {
    "N": ["Mostly Cloudy", "Cloudy", "Clouds", "Partly Cloudy", "Scattered Clouds", "Overcast"],
    "B": ["Clear"],
    "R": ["Rain"],
    "H": ["Mostly Clear", "Mostly Sunny", "Breezy and Partly Cloudy"],
    "Q": ["Mostly Cloudy with Light Rain", "Drizzle", "Light Rain", "Mostly Cloudy with Showers Nearby"],
    "X": ["Light Snow", "Snow", "Cloudy with Light Snow"]
};


// Creation of the weather app
var weatherApp = angular.module("weatherApp", []);


// Creation of the weather controller
weatherApp.controller("weatherCtrl", ["$scope", "$http",  function($scope, $http) {
    
    // List of the APIs with their full name and website address 
    $scope.apis = {
        "openweathermap": {
            name: "OpenWeatherMap",
            href: "http://openweathermap.org/"
        },
        "forecastio": {
            name: "Forecast.io",
            href: "http://forecast.io/"
        },
        "aerisweather": {
            name: "AERIS Weather",
            href: "http://wx.aerisweather.com/"
        },
        "wunderground": {
            name: "Weather Underground",
            href: "https://www.wunderground.com"
        }
    };
    
    
    // List of locations
    // Preadded Dublin as an example
    $scope.locations = [
        { 
        "name": "Dublin",
        "country": "IE",
        "state": "",
        "longitude": "-6.26719",
        "latitude": "53.34399",
        "weather": "--",
        "temperature": "--",
        "weather_icon": ")"}
    ];
    
    
    // Declaration of a few variables
    
    // id of the active location
    $scope.active_location = 0;
    // true if searching for a location
    $scope.location_search_loading = false;
    // array of the results of the location search
    $scope.location_search_results = [];
    // true if the results are displayed 
    // if false, the search tooltip will be displayed (see HTML)
    $scope.search_results_displayed = false;
    // text of the location search input
    $scope.location = "";
    // array of the different weathers coming from the APIs
    $scope.weathers = [];
    // id of the api whose details are displayed
    // -1: no details are displayed 
    $scope.current_api = -1;
  
    
    
    // Called a location header is clicked
    // Changes the active location and gets the forecasts from the APIs
    $scope.change_location = function(index) {
        $scope.active_location = index;    
        $scope.current_api = - 1;
        
        $scope.getForecast();
    };
    
    
    // Called when a new location is added
    $scope.addLocation = function(location) {
        // Pushes the new location in $scope.locations
        $scope.locations.push({
            name: location.place.name,
            country: location.place.country,
            state: location.place.state,
            longitude: location.loc.long,
            latitude: location.loc.lat,
            weather: "--",
            temperature: "--",
            weather_icon: ")"
        });
        
        // Resets the input text and the search results
        $scope.location = "";
        $scope.location_search_results = [];
        $scope.search_results_displayed = false;
        
        // Updates the active location and the active api
        $scope.active_location = $scope.locations.length - 1;
        $scope.current_api = - 1;
        
        // Gets the forecasts for this location
        $scope.getForecast();
    }
    
    
    
    
    // Updates the search results
    // Called when enter is pressed in the location text input
    $scope.updateLocationHintList = function() {

        // Displays the "Searching..." tooltip
        $scope.location_search_loading = true;
        
        // Convert the jQuery-like data to a Angular $http-like data
        var data = $.param({location: $scope.location.replace(/ /g, "+")});
        
        // POST request to getcoordinates.php
        $http({ 
            method: 'POST',
            url: './inc/getcoordinates.php',
            data: data,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(function successCallback(response) {
           // Success callback
            
            // Hides the "Searching..." tooltip
            $scope.location_search_loading = false;           
                                    
            if (response.data.response === undefined)  {
                // If the location is not found, response.data.response === undefined
                // In this case, the results is an empty array
                $scope.location_search_results = [];
            } else {
                // Otherwise the results is exactly response.data.response
                $scope.location_search_results = response.data.response;
            }
            
            
            // Makes the results visible
            $scope.search_results_displayed = true;   
            
            
        }, function errorCallback(response) {
            // Error callback
            console.error("Error while retrieving the location");
        });
    }
    
    
    // Called when a key is pressed in the location text input
    $scope.locationInputPressed = function(event) {
        
        if (event.keyCode == 13) {
            // If the key is "Enter"
            // Searches for this location and displays the results
            $scope.updateLocationHintList();
        } else {
            // Otherwise hides the search results and display the search tooltip (see HTML)
            $scope.search_results_displayed = false;
        }
      
    };
    
    
    // Gets the forecasts/observations from the APIs
    $scope.getForecast = function() {
                
        var data;
        var api;
        // Resets the array of different weathers coming from the APIs
        $scope.weathers = [];
        
        
        // For each api in the API list apis
        for (api in $scope.apis) {

            // Convert the jQuery-like data to a Angular $http-like data
            data = $.param({
                longitude: $scope.locations[$scope.active_location].longitude,
                latitude: $scope.locations[$scope.active_location].latitude,
                api: api
            });

            // POST request to getforecast.php
            $http({ 
                method: 'POST',
                url: './inc/getforecast.php',
                data: data,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).then(function successCallback(response) {
                // Success callback
                
                // Pushes the weather data received in the $scope.weathers array
                $scope.weathers.push({
                    api: response.data.api,
                    temperature: response.data.temperature,
                    weather: response.data.weather
                });
                                
                // Updates the SVG-d3.js temperature bar
                $scope.update_temperature_bar();
                
                // Calcultes the average values and updates them
                $scope.update_average_values();

            }, function errorCallback(response) {
                // Error callback
                console.error("Error while retrieving the data");            
            });


        }
               
    }
    
    
    
    // Calcultes the average values and updates them
    $scope.update_average_values = function() {
        // Declares and resets the values
        var average_temp = 0;
        var average_weather = "";
        var weather_list = {};
        var this_weather;
        var best_weather = ""
        var second_best_weather = "";
        var best_weather_nb = 0
        var second_best_weather_nb = 0;
        
        
        // For each weather data received in $scope.weathers
        for (var i=0; i<$scope.weathers.length; i++) {
            // Adds the temperature to average_temp
            average_temp += $scope.weathers[i].temperature;
            
            // Gets the weather
            this_weather = $scope.weathers[i].weather;
        
            if (weather_list[this_weather] === undefined) {
                // If this weather value has not been seen before, 
                // creates this value property in weather_list and gives the value 1
                weather_list[this_weather] = 1;
            } else {
                // If this weather value has already been seen before, 
                // increments the corresponding property in weather_list
                weather_list[this_weather]++;
            }
            
            
        }        
        
        // Calculates the average temperature
        // And rounds it to 2 decimal digits
        average_temp = parseInt((average_temp / $scope.weathers.length) * 100)/100;
        
        
                  
        // For each value in the weather_list
        $.each(weather_list, function(key, value) {
            
            if (value > best_weather_nb) {
                // If this weather value has more hits than the best_weather
                // Makes it the best weather
                second_best_weather = best_weather;
                second_best_weather_nb = best_weather_nb;
                best_weather = key;
                best_weather_nb = value;
            } else if (value > second_best_weather_nb) {
                // Otherwise, if this weather value has more hits than the second best_weather
                // Makes it the second best weather 
                second_best_weather = key;
                second_best_weather_nb = value;
            }
        });

        // Makes the final average_weather text
        // By concatenating the second_best_weather + "-ly" + best_weather
        if (second_best_weather != "") {
            average_weather = second_best_weather + "-ly " + best_weather;
        } else {
            average_weather = best_weather;
        }

        
        
        // Updates the models
        $scope.locations[$scope.active_location].weather = average_weather;
        $scope.locations[$scope.active_location].weather_icon = $scope.get_icon(best_weather);
        $scope.locations[$scope.active_location].temperature = average_temp;
    };
    
    
    
    
    
    
    // Updates the SVG-d3?js temperature bar
    $scope.update_temperature_bar = function() {
        
        // Empties the bar
        document.getElementById("temperature_bar").innerHTML = "";
        
        // Sets the dimensions of the SVG
        var height = 60;
        var width = document.getElementById("details_div").offsetWidth;
        
        // Left and right x-offset for the first and last circles
        var xoffset = 50;
        
        // Circles' properties 
        var circle_radius = 10;
        var circle_stroke_width = 2;
                
        // Updates the dimensions of the bar
        var bar = d3.select("#temperature_bar")
            .attr("width", width)
            .attr("height", height);
        
        // Creates the temperature line
        var line = bar.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", height/2)
            .attr("y2", height/2)
            .style("stroke", "#888")
            .style("stroke-width", 4);
        
        
        // Creates the temperature scale 
        // From the x-offset + half the size of a circle
        // To the bar width - x-offset - half the size of a circle
        var tempScale = d3.scale.linear()
            .range([xoffset + circle_radius + circle_stroke_width, width - circle_radius - circle_stroke_width - xoffset]);
        
        // Creates the temperature domain
        // With the minimum and maximu temperateures in $scope.weathers
        var tempDomain = d3.extent($scope.weathers, function(element) {
            return element.temperature;
        });
        
        // Links the temperature scale and domain together
        tempScale.domain(tempDomain);
        
        // Binds $scope.weathers to the g.circle's and appends them to the bar
        var circles = bar.selectAll("g.circle")
            .data($scope.weathers)
            .enter()
            .append("g")
            .attr("class", "circle");
        
        // For each g.circle, appends a circle
        // The fill color property is calculated from the temperature using color_from_temp
        // The cx position property is calculated from the temperature using the temperature scale/domain
        circles.append("circle")
            .classed("bar_circle", true)
            .attr("cy", height/2)
            .attr("r", circle_radius)
            .style("stroke", function(d) {
                return "#888";
            })
            .style("stroke-width", circle_stroke_width)
            .style("fill", function(d) {
                return color_from_temp(d.temperature);
            })
            .attr("cx", function(d) {
                return tempScale(d.temperature);
            })        
            
        
        // For each g.circle, appends a text
        // The text is the corresponding temperature + "°C"
        // The x position property is calculated from the temperature using the temperature scale/domain
        circles.append("text")
            .text(function(d) {
                return d.temperature + "°C";
            })
            .attr("x", function(d) {
                return tempScale(d.temperature);
            })
            .attr("y", 15);
        
        
        // Appends a polyline to the bar
        // Will be used as an arrow when mouseover
        bar.append('polyline')
            .style('stroke', '#888')
            .style("stroke-width", 4)
            .style("fill", "none");
        

        // Binds an onmouseover listener to all the g.circle
        bar.selectAll("g.circle")
            .on("mouseover", function(d) {
            
                $scope.$apply(function() {
                    // Updates the active api
                    $scope.current_api = $scope.weathers.indexOf(d);
                });
            
                // Draws the triangle-shape arrow aligned with the hoverd circle
                bar.select("polyline")
                    .transition()
                    .attr('points', 
                     generateTriangle(tempScale(d.temperature), height/2 + circle_radius + 10, 2 * circle_radius, circle_radius)
                
                    );
            
            
                // Displays the api_details
                d3.select("#api_details")
                    .style("display", "flex");
                
            })
          
        
        
        // Updates the active location header with the color corresponding to the average temperature
        d3.select(".location_tab_header.active")
            .style("background-color", color_from_temp($scope.locations[$scope.active_location].temperature));
        
    
    };
    
    
    
    // Gets the character value corresponding to the weather value
    // To be used with the meteo_icons
    $scope.get_icon = function(text) {
        
        for (icon in meteo_icons) {
            if (meteo_icons[icon].indexOf(text) != -1) {
                return icon;
            }
        }
    
        // If the weather value is not in the list, 
        // Uses ")" which corresponds the the N/A icon
        return ")";
        
    }

    
    
    // Selects the first location as default
    $scope.change_location(0);
    
}]);


// Generates the triangle/arrow-shape polyline "points" value
// xoffset: x position of the top of the arrow
// yoffset: y position of the top of the arrow
// width: width of the arrow
// height: height of the arrow
function generateTriangle(xoffset, yoffset, width, height) {
        
    return (xoffset + width/2) + " " + (yoffset + height) + ", " + xoffset + " " + yoffset + ", " + (xoffset - width/2) + " " + (yoffset + height);
    
}


// Calculates a color from a temperature
// Uses a temperature scale from -5 to 35°C
// Uses a color scale from purple to red going through blue, green and yellow
function color_from_temp(temp) {

    // Declares the temperature scale breakpoints
    var temp_scale = [-5, 5, 15, 25, 35];
    
    // Declares the color scale breakpoints
    // with r, g and b values
    var color_scale = [
        { r: 63, g: 0, b: 255},
        { r: 0, g: 252, b: 252},
        { r: 53, g: 214, b: 0},
        { r: 252, g: 252, b: 0},
        { r: 255, g: 0, b: 0}
    ];
    var r, g, b;

    // Calculates in which frame the temperature is
    var i = 4;
    while ((temp < temp_scale[i]) && (i>-1)) {
        i--;
    }

    
    if (i==-1) {
        // If the temperature is below the minimum in the temperature scale,
        // Uses the purple value
        return "rgb(63, 0, 255)";     
    } else if (i==4) {
        // If the temperature is above the maximum in the temperature scale,
        // Uses the red value
        return "rgb(255, 0, 0)";     
    } else {
        // Otherwise interpolates the color value within the frame
        var coeff = (temp - temp_scale[i]) / (temp_scale[i+1] - temp_scale[i]);
    
        r = color_scale[i].r + (color_scale[i+1].r - color_scale[i].r) * coeff;
        g = color_scale[i].g + (color_scale[i+1].g - color_scale[i].g) * coeff;
        b = color_scale[i].b + (color_scale[i+1].b - color_scale[i].b) * coeff;
    }

    // Returns the rgb value as a string
    return "rgb(" + parseInt(r) + ", " + parseInt(g) + ", " + parseInt(b) + ")";
}