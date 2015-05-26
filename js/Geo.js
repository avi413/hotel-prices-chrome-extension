var Geo = (function(){

  var API_URL = 'http://maps.googleapis.com/maps/api/geocode/json?address=';

  var getLocation = function( address, onSuccess, onError ){
    var url = API_URL + encodeURIComponent( address );
    $.getJSON( url )
      .done(function( json ){
        if (json && json.status === 'OK' && json.results.length) {
          var location = json.results[0].geometry.location;
          console.log(location);
          if (typeof onSuccess === 'function') onSuccess( location );
        }
      });
  };

  return {
    getLocation: getLocation
  };

})();
