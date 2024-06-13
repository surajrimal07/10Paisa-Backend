
// function displayLocationData(data) {
//     console.log(`
//     IP Address: ${data.ip}
//     Accuracy: ${data.accuracy} meters
//     Latitude: ${data.latitude}
//     Longitude: ${data.longitude}
//     City: ${data.city}
//     Country: ${data.country}
//     Timezone: ${data.timezone}
//     Postal Code: ${data.postal_code}
//     ${data.continent_code ? `Continent Code: ${data.continent_code}` : ""}
//     ${data.organization ? `Organization: ${data.organization}` : ""}
//     ${data.organization_name ? `ISP Name: ${data.organization_name}` : ""}
//     ${data.region ? `Region: ${data.region}` : ""}
//   `);
// }

// function getCityFromCoordinates(latitude, longitude) {
//     const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

//     return fetch(url)
//         .then(response => response.json())
//         .then(data => {
//             if (data && data.address) {
//                 return {
//                     city: data.address.city || data.address.town || data.address.village || "",
//                     postal_code: data.address.postcode || "",
//                     country_code: data.address.country_code || "",
//                     continent_code: data.address.continent_code || "",
//                     organization: data.address.organization || "",
//                     organization_name: data.address.organization_name || "",
//                     region: data.address.region || "",
//                 };
//             } else {
//                 throw new Error("No results found");
//             }
//         });
// }

// function fetchLocationData() {
//     fetch("https://get.geojs.io/v1/ip/geo.json")
//         .then(response => response.json())
//         .then(ipData => {

//             console.log(ipData);
//         })
//         .catch(error => {
//             console.error("An error occurred while fetching IP information:", error);
//         });
// }

// // Execute the function
// fetchLocationData(
// );


async function fetchUserGeoLocationData() {
    const userGeoData = await fetch('https://api.ip2location.io/?key=3B2CB46C0C0491F35A3A7A08CEFF8B20&ip=103.129.134.43')
        .then(response => response.json())

    return userGeoData;

}

console.log(await fetchUserGeoLocationData());