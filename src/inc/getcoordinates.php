<?php

// Gets the location from the POST value
$location = $_POST['location'];

  
// USE YOUR OWN clientid AND clientsecret HERE!!!
$clientid = "";
$clientsecret = "";

$service_url = "http://api.aerisapi.com/places/search?query=name:^" . $location . "&limit=20&client_id=" . $clientid . "&client_secret=" . $clientsecret;



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

// returns the response 
echo $curl_response;


?>