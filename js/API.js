var API = (function(){

  var API_URL = 'http://services.carsolize.com/BookingServices/DynamicDataService.svc';
  var username = '';
  var password = '';
  var sessionId = '';

  var payloadTemplate = [
    '<?xml version="1.0" encoding="UTF-8"?>',
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
    '</s:Envelope>'
  ].join('\n');


  var hotelDetailsTemplate = [
    '<?xml version="1.0" encoding="UTF-8" ?>',
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
        '<ServiceRequest xmlns="http://tempuri.org/">',
          '<rqst xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
            '<Request xmlns="" i:type="HotelsSupplierDetailsRequest">',
              '<ClientIP i:nil="true" />',
              '<HotelID>{{hotelId}}</HotelID>',
              '<IncludePackageDetails>false</IncludePackageDetails>',
              '<PackageID>00000000-0000-0000-0000-000000000000</PackageID>',
              '<SupplierID>0</SupplierID>',
            '</Request>',
            '<RequestType xmlns="">GetAdditionalDetails</RequestType>',
            '<SessionID xmlns="">{{sessionId}}</SessionID>',
            '<TypeOfService xmlns="">Hotels</TypeOfService>',
          '</rqst>',
        '</ServiceRequest>',
      '</s:Body>',
    '</s:Envelope>'
  ].join('\n');


  var packageDetailsTemplate = [
    '<?xml version="1.0" encoding="UTF-8" ?> ',
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
        '<ServiceRequest xmlns="http://tempuri.org/">',
          '<rqst xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
            '<Request xmlns="" i:type="HotelsSupplierDetailsRequest">',
              '<ClientIP i:nil="true" /> ',
              '<HotelID>{{hotelId}}</HotelID> ',
              '<IncludePackageDetails>true</IncludePackageDetails> ',
              '<PackageID>00000000-0000-0000-0000-000000000000</PackageID> ',
              '<SupplierID>0</SupplierID> ',
            '</Request>',
            '<RequestType xmlns="">GetAdditionalDetails</RequestType> ',
            '<SessionID xmlns="">{{sessionId}}</SessionID> ',
            '<TypeOfService xmlns="">Hotels</TypeOfService> ',
          '</rqst>',
        '</ServiceRequest>',
      '</s:Body>',
    '</s:Envelope>',
  ].join('\n');


  var paymentPreferencesTemplate = [
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
        '<ServiceRequest xmlns="http://tempuri.org/">',
          '<rqst xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
            '<Request i:type="HotelPaymentPreferencesRequest" xmlns="">',
              '<ClientIP i:nil="true" />',
              '<HotelID>{{hotelId}}</HotelID>',
              '<IncludeCancellationPolicy>false</IncludeCancellationPolicy>',
              '<PackageID>{{packageId}}</PackageID>',
            '</Request>',
            '<RequestType xmlns="">GetPaymentPreferences</RequestType>',
            '<SessionID xmlns="">{{sessionId}}</SessionID>',
            '<TypeOfService xmlns="">Hotels</TypeOfService>',
          '</rqst>',
        '</ServiceRequest>',
      '</s:Body>',
    '</s:Envelope>'
  ].join('\n');


/**
 *
 */

  var bookingTemplate = [
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">',
      '<s:Body>',
        '<ServiceRequest xmlns="http://tempuri.org/">',
          '<rqst xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
            '<Request i:type="HotelBookRequest" xmlns="">',
              '<ClientIP i:nil="true" />',
              '<BookingPrice>{{package.price}}</BookingPrice>',
              '{{{Card}}}',
              '<HotelID>{{package.hotelId}}</HotelID>',
              '<InternalAgentRef1>{{InternalAgentRef1}}</InternalAgentRef1>',
              '<InternalAgentRef2>{{InternalAgentRef2}}</InternalAgentRef2>',
              '<LeadPaxId>{{passengers.0.guid}}</LeadPaxId>',
              '<LeadPaxRoomId>{{package.roomId}}</LeadPaxRoomId>',
              '<PackageID>{{package.packageId}}</PackageID>',
              '<Passengers>',
                '{{{Passengers}}}',
              '</Passengers>',
              '<RoomsRemarks xmlns:d6p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays">',
                '<d6p1:KeyValueOfstringstring>',
                  '<d6p1:Key>{{roomRemark}}</d6p1:Key>',
                  '<d6p1:Value i:nil="true" />',
                '</d6p1:KeyValueOfstringstring>',
              '</RoomsRemarks>',
              '<SelectedPaymentMethod>{{paymentMethod}}</SelectedPaymentMethod>',
            '</Request>',
            '<RequestType xmlns="">Book</RequestType>',
            '<SessionID xmlns="">{{{sessionId}}}</SessionID>',
            '<TypeOfService xmlns="">Hotels</TypeOfService>',
          '</rqst>',
        '</ServiceRequest>',
      '</s:Body>',
    '</s:Envelope>'
  ].join('\n');


  var customerInfoTemplate = [
    '<CustomerInfo>',
      '<Address>',
        '<AddressLine>{{addressLine}}</AddressLine>',
        '<CityName>{{cityName}}</CityName>',
        '<CountryName />',
        '<PostalCode>{{postalCode}}</PostalCode>',
      '</Address>',
      '<Allocation>{{allocation}}</Allocation>',
      '<Email>',
        '<Value>{{email}}</Value>',
      '</Email>',
      '<Id>{{guid}}</Id>',
      '<PersonDetails>',
        '<Name>',
          '<GivenName>{{firstname}}</GivenName>',
          '<NamePrefix>{{title}}</NamePrefix>',
          '<Surname>{{lastname}}</Surname>',
        '</Name>',
        '<Type>{{type}}</Type>',
      '</PersonDetails>',
      '<Telephone>',
        '<PhoneNumber>{{phone}}</PhoneNumber>',
      '</Telephone>',
    '</CustomerInfo>',
  ].join('\n');


  var cardTemplate = [
    '<Card xmlns:d6p1="http://schemas.datacontract.org/2004/07/IsuBe.Public.Enteties.Payment">',
      '<d6p1:AddressLine>{{addressLine}}</d6p1:AddressLine>',
      '<d6p1:CVV>{{cvv}}</d6p1:CVV>',
      '<d6p1:CardNumber>{{cardNumber}}</d6p1:CardNumber>',
      '<d6p1:CardType>{{cardType}}</d6p1:CardType>',
      '<d6p1:City>{{city}}</d6p1:City>',
      '<d6p1:Country>{{country}}</d6p1:Country>',
      '<d6p1:ExpireDate>{{expireDate}}</d6p1:ExpireDate>',
      '<d6p1:HolderName>{{name}}</d6p1:HolderName>',
      '<d6p1:ZipCode>{{zipcode}}</d6p1:ZipCode>',
    '</Card>',
  ].join('\n');


  /**
   * Public
   */

  var init = function( u, p ){
    username = u;
    password = p;
  };


  var setSessionId = function( id ){
    sessionId = id;
  };


  var getSessionId = function(){
    return sessionId;
  };

  /**
   *
   */
  var getPrices = function( params, onSuccess, onError ){

    var cacheKey = $.map( params, function(v){ return v;} ).join('_');
    var cachedResponse = Cache.get( cacheKey );
    if (cachedResponse) {
      if (typeof onSuccess === 'function') onSuccess( cachedResponse );
      return;
    }

    var payload = updateTemplateParams( payloadTemplate, params );

    //console.log(payload);
    sendRequest( payload, function( xml ){
      Cache.set( cacheKey, xml);
      if (typeof onSuccess === 'function') onSuccess(xml);
    });
  };


  /**
   * @param  {object} params    {hotelId}
   */
  var getHotelDetails = function( params, onSuccess, onError ){
    var payload = updateTemplateParams( hotelDetailsTemplate, params );
    sendRequest( payload, onSuccess, onError);
  };


  /**
   * @param  {object} params    {hotelId}
   */
  var getPackageDetails = function( params, onSuccess, onError ){
    var payload = updateTemplateParams( packageDetailsTemplate, params );
    sendRequest( payload, onSuccess, onError);
  };


  /**
   * @param  {object} params    {hotelId, packageId}
   */
  var getPaymentPreferences = function( params, onSuccess, onError ){
    var payload = updateTemplateParams( paymentPreferencesTemplate, params );
    sendRequest( payload, onSuccess, onError);
  };


  var makeBooking = function( params, onSuccess, onError ){
    var Passengers = '';
    for (var i = 0, len = params.passengers.length; i < len; i++) {
      var passenger = params.passengers[i];
      passenger.allocation = params.package.roomId;
      Passengers += Mustache.to_html( customerInfoTemplate, passenger ) + '\n';
    }
    params.Passengers = Passengers;
    if ( params.card && params.paymentMethod.match(/CreditCard/) ) {
      var cardPayload = Mustache.to_html( cardTemplate, params.card );
      params.Card = cardPayload;
    }
    var payload = updateTemplateParams( bookingTemplate, params );
    sendRequest( payload, function( xml ){
      console.log(xml);
    });
    if (typeof onSuccess === 'function') onSuccess( payload );
    console.log(payload);
  };


  var updateTemplateParams = function( payload, params ){
    params.username = username;
    params.password = password;
    params.sessionId = sessionId;
    payload = Mustache.to_html( payload, params);
    return payload;
  };


  var sendRequest = function( payload, onSuccess, onError ){
    $.ajax({
      type: "POST",
      url: API_URL,
      //url: payload.match(/HotelsSupplierDetailsRequest/) ? '/data/packages.xml' : '/data/response.xml',
      dataType: "xml",
      processData: false,
      contentType: "text/xml; charset=\"utf-8\"",
      headers: {
        SOAPAction: 'http://tempuri.org/IDynamicDataService/ServiceRequest'
      },
      data: payload
    })
      .done(function(xml){
        var error = $(xml).find('Error ErrorText').text();
        if (error) {
          if (typeof onError === 'function') onError(error);
        }
        else if (typeof onSuccess === 'function') onSuccess(xml);
      });
  };


  return {
    init: init,
    getSessionId: getSessionId,
    setSessionId: setSessionId,
    getPrices: getPrices,
    getHotelDetails: getHotelDetails,
    getPackageDetails: getPackageDetails,
    getPaymentPreferences: getPaymentPreferences,
    makeBooking: makeBooking
  };

})();
