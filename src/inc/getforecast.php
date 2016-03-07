<?php

// Gets the data from the POST values
$api = $_POST['api'];
$longitude = $_POST['longitude'];
$latitude = $_POST['latitude'];


// Creates the $service_url depending on the API used
// USE YOUR OWN clientid AND clientsecret OR apikey HERE!!!
switch ($api) {
    case "openweathermap":
        $apikey = "";
        $service_url = "http://api.openweathermap.org/data/2.5/weather?lat=" . $latitude . "&lon=" . $longitude . "&appid=" . $apikey . "&units=metric";
        break;
        
    case "forecastio":
        $apikey = "";
        $service_url =  "https://api.forecast.io/forecast/" . $apikey . "/" . $latitude . "," . $longitude . "?units=si";
        break;
        
    case "aerisweather":
        $clientid = "";
        $clientsecret = "";
        $service_url = "http://api.aerisapi.com/observations/closest?p="  . $latitude . "," . $longitude . "&client_id=" . $clientid . "&client_secret=" . $clientsecret;
        break;
        
    case "wunderground":
        $apikey = "";      
        $service_url = "http://api.wunderground.com/api/" . $apikey . "/conditions/q/" . $latitude . "," . $longitude . ".json";
        break;
        
    default: 
        exit("Unknown API.");
        break;
}



// Initialises curl
$curl = curl_init($service_url);

curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

// Executes the curl request
$curl_response = curl_exec($curl);

// Handles an error during the request
if ($curl_response === false) {
    $info = curl_getinfo($curl);
    curl_close($curl);
    exit('error occured during curl exec. Additional info: ' . var_export($info));
}
curl_close($curl);

// Decodes the response
$decoded = json_decode($curl_response);

// Handles any error in the response
if (isset($decoded->response->status) && $decoded->response->status == 'ERROR') {
    exit('error occured: ' . $decoded->response->errormessage);
}



// Gets the weather and temperature value depending on the API
switch ($api) {
    case "openweathermap":
        $weather = $decoded->weather[0]->main;
        $temperature = $decoded->main->temp;
        break;
        
    case "forecastio":
        $weather = $decoded->currently->summary;
        $temperature = $decoded->currently->temperature;
        break;
        
    case "aerisweather":
        $weather = $decoded->response[0]->ob->weather;
        $temperature = $decoded->response[0]->ob->tempC;
        break;
       
    case "wunderground":
        $weather = $decoded->current_observation->weather;
        $temperature = $decoded->current_observation->temp_c;
        break;
        
    default: 
        exit("Unknown API.");
        break;
}


// Returns the data in a JSON representation
echo '{"weather": "' . $weather . '", "temperature": ' . $temperature . ', "api":"' . $api . '"}';




?>