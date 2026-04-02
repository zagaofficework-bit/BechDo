const axios = require("axios");

////////////////////////////////////////////////////////////////////
//// REVERSE GEOCODE — coordinates → address
//// lat, lng → { street, city, state, pincode, country, full }
////////////////////////////////////////////////////////////////////

exports.reverseGeocode = async (latitude, longitude) => {
  const url = `https://api.opencagedata.com/geocode/v1/json`;

  const response = await axios.get(url, {
    params: {
      q:          `${latitude}+${longitude}`,
      key:        process.env.OPENCAGE_API_KEY,
      language:   "en",
      countrycode: "in",   // restrict to India — remove if global
      limit:       1,
      no_annotations: 1,
    },
  });

  const results = response.data?.results;

  if (!results || results.length === 0) {
    throw new Error("No address found for these coordinates");
  }

  const components = results[0].components;
  const formatted  = results[0].formatted;

  // OpenCage returns different field names for different regions
  // so we check multiple fallbacks
  return {
    street:  components.street
          || components.road
          || components.pedestrian
          || components.footway
          || null,

    city:    components.city
          || components.town
          || components.village
          || components.county
          || null,

    state:   components.state || null,

    pincode: components.postcode || null,

    country: components.country || "India",

    full:    formatted || null,

    // Raw coordinates stored on User.location
    coordinates: {
      latitude:  parseFloat(latitude),
      longitude: parseFloat(longitude),
    },
  };
};


////////////////////////////////////////////////////////////////////
//// FORWARD GEOCODE — address string → coordinates
//// "Mumbai, Maharashtra" → { lat, lng }
//// Used when user manually types address
////////////////////////////////////////////////////////////////////

exports.forwardGeocode = async (addressString) => {
  const url = `https://api.opencagedata.com/geocode/v1/json`;

  const response = await axios.get(url, {
    params: {
      q:              addressString,
      key:            process.env.OPENCAGE_API_KEY,
      language:       "en",
      countrycode:    "in",
      limit:          1,
      no_annotations: 1,
    },
  });

  const results = response.data?.results;

  if (!results || results.length === 0) {
    throw new Error("Could not find coordinates for this address");
  }

  const { lat, lng } = results[0].geometry;

  return {
    latitude:  parseFloat(lat),
    longitude: parseFloat(lng),
  };
};