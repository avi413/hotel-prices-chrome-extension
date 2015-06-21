(function(){

  var init = function(){
    var sessionId = getQueryVariable('sessionId');
    var hotelId = getQueryVariable('hotelId');

    API.setSessionId( sessionId );
    API.getHotelDetails( {hotelId: hotelId}, processHotelDetails );
    API.getPackageDetails( {hotelId: hotelId}, processPackageDetails );
  };


  function getQueryVariable(variable) {
    var query = document.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    console.log('Query variable %s not found', variable);
  }



  var processHotelDetails = function( xml ){
    var $xml = $(xml);
    $('#hotel-details').text( (new XMLSerializer()).serializeToString(xml) );
  };


  var processPackageDetails = function( xml ){
    var $xml = $(xml);
    $('#packages').text( (new XMLSerializer()).serializeToString(xml) );
  };


  init();

})();
