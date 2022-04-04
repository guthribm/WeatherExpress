const { response } = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const https = require("https");
const app = express();

// ############ VARIABLE DECLARATIONS ############

// declare longitude and latitude variables
let LONG = 0;
let LAT = 0;
let CITY = "";
let CurrentData = "";
let hourlyArray = [];
let array = [];

// #### SETUP for ONECALL WEATHER ##########

const oneCallUrl = {
  base: "https://api.openweathermap.org/data/2.5/onecall?",
  lat: "lat=",
  lon: "&lon=",
  exclude: "&exclude=",
  other: `&appid=${process.env.OPENWEATHER}`,
};

// Options for getDate function

const dateOptions = {
  resultsOptions: {
    weekday: "short",
    month: "2-digit",
    day: "numeric",
    year: "numeric",
  },
  singleDayOptions: {
    weekday: "short",
  },
  hourlyOptions: {
    hour: "numeric",
  },
  numericalFullOptions: {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  },
};

// let resultsOptions = {
//   weekday: "short",
//   month: "2-digit",
//   day: "numeric",
//   year: "numeric",
// };

// let singleDayOptions = {
//   weekday: "long",
// };

// let hourlyOptions = {
//   hour: "2-digit",
//   minute: "2-digit",
//   timeZoneName: "short",
// };

// let numericalFullOptions = {
//   month: "2-digit",
//   day: "2-digit",
//   year: "2-digit",
// };

// ############ STANDARD SERVER SETUP ############

// sets EJS
app.set("view engine", "ejs");

// tell express to use public folder for static files like CSS, etc
app.use(express.static("public"));

// standard setup to use body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// ############ END STANDARD SERVER SETUP ############

// URL endpoint, units and auth
const url = {
  base: "https://api.openweathermap.org/data/2.5/weather?zip=",
  other: `&units=imperial&appid=${process.env.OPENWEATHER}`,
};

// a function that takes the dt from the api response and returns a day of the week
// depending on options provided
function getDay(dt, options) {
  let date = new Date(dt * 1000);
  return date.toLocaleString("en-US", options);
}

// ############ HANDLES GET REQUEST FOR HOME PAGE ############
app.get("/", (req, res) => {
  res.render("index");
});

// ############ POST RESPONSE WITH CURRENT WEATHER TO RESULTS PAGE ############
app.post("/", (req, res) => {
  let userCity;
  try {
    userCity = req.body.cityName;
  } catch (e) {
    console.log("error: " + e);
  }
  if (userCity.length !== 5) {
    // Handles error if zip code is too short
    res.render("error");
  } else {
    https.get(`${url.base}${userCity}&${url.other}`, (response) => {
      response.on("data", (d) => {
        try {
          const data = JSON.parse(d);
          LAT = data.coord.lat;
          LONG = data.coord.lon;
          CITY = data.name;
          // test following:
          let hourlyAPI = `${oneCallUrl.base}${oneCallUrl.lat}${LAT}${oneCallUrl.lon}${LONG}${oneCallUrl.exclude}daily,alerts,minutely&units=imperial${oneCallUrl.other}`;
          https.get(hourlyAPI, (response) => {
            response.on("data", (testD) => {
              const parsedData = JSON.parse(testD);
              hourlyArray = parsedData.hourly;

              res.render("results", {
                city: CITY,
                date: getDay(data.dt, dateOptions.resultsOptions),
                currentTemp: data.main.temp,
                currentDesc: data.weather[0].description,
                currentIcon: data.weather[0].icon,
                feels: data.main.feels_like,
                tempMax: data.main.temp_max,
                tempMin: data.main.temp_min,
                LAT: LAT,
                LONG: LONG,
                hourlyArray: hourlyArray,
                getDay: getDay,
                dateOptions: dateOptions,
                data: data,
              });
            });
          });
        } catch (e) {
          console.log("error: " + e);
          res.render("error");
        }
      }); // end response.on
    });
  }
});

// ############ HANDLES GET REQUEST FOR EXTENDED PAGE ############

// once extended forecast link is clicked, the endpoint searches for result.
// app.get will then use a callback function handler to run the One Call
// to openweather.api and display the results on the page.

app.get("/extended", (req, res) => {
  let APICALL = `${oneCallUrl.base}${oneCallUrl.lat}${LAT}${oneCallUrl.lon}${LONG}${oneCallUrl.exclude}minutely,alerts,hourly&units=imperial${oneCallUrl.other}`;
  // console.log("apicall: " + APICALL);
  https.get(APICALL, (response) => {
    response.on("data", (d) => {
      const data = JSON.parse(d);
      CurrentData = data;
      let dailyArray2 = data.daily;
      array = data.daily;
      // console.log("dailyArray2: " + dailyArray2);
      res.render("extended", {
        currentTemp: data.current.temp,
        currentFeelsLike: data.current.feels_like,
        currentWind: data.current.wind_speed,
        currentDesc: data.current.weather[0].description,
        currentIcon: data.current.weather[0].icon,
        city: CITY,
        currentData: CurrentData,
        dailyArray: dailyArray2,
        gDay: getDay,
        singleDayOptions: dateOptions.singleDayOptions,
        numericalFullOptions: dateOptions.numericalFullOptions,
        LAT: data.lat,
        LONG: data.lon,
        dateOptions: dateOptions,

        date: getDay(data.current.dt, dateOptions.resultsOptions),
      });
    });
  });
});
//   });
// });

// ############ HANDLES GET REQUEST FOR ABOUT PAGE ############
app.get("/about", (req, res) => {
  res.render("about");
});

// must change port for heroku to recognize
app.listen(process.env.PORT || 3000, () =>
  console.log("server is running on port 3000")
);
