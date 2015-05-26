var API = (function(){

  var API_URL = 'http://services.carsolize.com/BookingServices/DynamicDataService.svc';
  var username = '';
  var password = '';

  var payloadTemplate = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
     '<s:Body>',
        '<ServiceRequest xmlns="http://tempuri.org/">',
           '<rqst xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
              '<Credentials xmlns="">',
               '<Password>{{password}}</Password>',
                 '<UserName>{{username}}</UserName>',
              '</Credentials>',
              '<Request i:type="HotelsServiceSearchRequest" xmlns="">',
                 '<ClientIP i:nil="true"/>',
                 '<DesiredResultCurrency>EUR</DesiredResultCurrency>',
                 '<Residency>DE</Residency>',
                 '<CheckIn>{{checkin}}</CheckIn>',
                 '<CheckOut>{{checkout}}</CheckOut>',
                 '<ContractIds i:nil="true" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>',
                 '<DetailLevel>Meta</DetailLevel>',
                 '<ExcludeHotelDetails>false</ExcludeHotelDetails>',
                 '<GeoLocationInfo>',
                    '<Latitude>{{latitude}}</Latitude>',
                    '<Longitude>{{longitude}}</Longitude>',
                 '</GeoLocationInfo>',
                 '<HotelIds i:nil="true" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>',
                 '<HotelLocation i:nil="true"/>',
                 '<IncludeCityTax>false</IncludeCityTax>',
                 '<Nights>{{nights}}</Nights>',
                 '<RadiusInMeters>30000</RadiusInMeters>',
                 '<Rooms>',
                    '<HotelRoomRequest>',
                       '<AdultsCount>{{guests}}</AdultsCount>',
                       '<KidsAges xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>',
                    '</HotelRoomRequest>',
                 '</Rooms>',
                 '<SupplierIds i:nil="true" xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>',
              '</Request>',
              '<RequestType xmlns="">Search</RequestType>',
              '<TypeOfService xmlns="">Hotels</TypeOfService>',
           '</rqst>',
        '</ServiceRequest>',
     '</s:Body>',
  '</s:Envelope>'].join('\n');


  /**
   * Public
   */

  var init = function( u, p ){
    username = u;
    password = p;
  };


  var getPrices = function( params, onSuccess, onError ){

    var cacheKey = $.map( params, function(v){ return v;} ).join('_');
    var cachedResponse = Cache.get( cacheKey );
    if (cachedResponse) {
      if (typeof onSuccess === 'function') onSuccess( cachedResponse );
      return;
    }

    var payload = payloadTemplate;
    params.username = username;
    params.password = password;
    for (var key in params) {
      var re = new RegExp('{{' + key + '}}', 'g');
      payload = payload.replace( re, params[key]);
    }
    //console.log(payload);


    $.ajax({
      type: "POST",
      url: API_URL,
      //url: '/data/response.xml',
      dataType: "xml",
      processData: false,
      contentType: "text/xml; charset=\"utf-8\"",
      headers: {
        SOAPAction: 'http://tempuri.org/IDynamicDataService/ServiceRequest'
      },
      data: payload
    })
      .done(function(xml){
        Cache.set( cacheKey, xml);
        if (typeof onSuccess === 'function') onSuccess(xml);
      });
  };


  return {
    init: init,
    getPrices: getPrices
  };

})();
