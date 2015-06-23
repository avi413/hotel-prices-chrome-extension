(function(){

  var init = function(){
    var sessionId = getQueryVariable('sessionId');
    var hotelId = getQueryVariable('hotelId');
    var guestsCount = getQueryVariable('guests');

    API.setSessionId( sessionId );
    API.getHotelDetails( {hotelId: hotelId}, processHotelDetails );
    API.getPackageDetails( {hotelId: hotelId}, processPackageDetails );
    renderForms( guestsCount );
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
    var json = JSON.parse( xml2json(xml, '  ') );
    var data = {};
    console.log(json);
    try {
      data = json['s:Envelope']['s:Body'].ServiceRequestResponse.ServiceRequestResult.HotelSupplierDetails;
      data.description = data.Description['a:string'].join('<br/>');
      data.facilities = data.HotelFacilities['a:string'].join(', ');
    } catch (e) {
    }
    var html = Mustache.to_html( $('#hotel-details-template').html(), data );
    $('#hotel-details').html( html );
  };


  var processPackageDetails = function( xml ){
    var $xml = $(xml);
    var json = JSON.parse( xml2json(xml, '  ') );
    console.log(json);
    var data = {};
    try {
      data = json['s:Envelope']['s:Body'].ServiceRequestResponse.ServiceRequestResult.HotelsSearchResponse.Result.Hotel.Packages.RoomsPackage;
    } catch (e) {
      console.error(e);
    }
    console.log(data);
    var html = '';
    for (var i = 0, len = data.length; i < len; i++) {
      var package = data[i];
      html += Mustache.to_html( $('#packages-template').html(), package );
    }
    $('#packages').html( html );
    $('.package').click( pickPackage );
  };


  var renderForms = function( guestsCount ){
    var html = '';
    var guestForm = Mustache.to_html( $('#guest-template').html(), {} );
    for (var i = 0; i < guestsCount; i++) {
      html += guestForm;
    }
    $('#guests').html( html );
  };


  var pickPackage = function(){
    $('.package').removeClass('selected');
    $(this).addClass('selected');
  };


  init();

})();
