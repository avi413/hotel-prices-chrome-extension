var App = (function(){

  var init = function(){
    initMessaging();
  };


  var initMessaging = function(){
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
      if (request.cmd === 'get_prices') {
        console.log(request.data);
        getPrices( request.data, sender.tab.id );
      }
      else if (request.cmd === 'book_hotel') {
        bookHotel( request.data.hotelId );
      }
    });
  };


  var getPrices = function( data, forTabId ){
    var url = data.url;
    delete data.url;
    Geo.getLocation( data.city, function( location ){
      var params = $.extend( data, {
        latitude: location.lat,
        longitude: location.lng
      });
      params.nights = Math.floor(( Date.parse(params.checkout) - Date.parse(params.checkin) ) / 86400000);
      params.checkin += 'T00:00:00Z';
      params.checkout += 'T00:00:00Z';

      API.getPrices( params, function( response ){
        var data = processPricesXML( response, params );
        chrome.tabs.sendMessage( forTabId, {
          cmd: 'price_list',
          data: {
            url: url,
            prices: data.prices
          }
        });
      } );
    });
  };


  var processPricesXML = function( xml, searchParams ){
    var $xml = $(xml);
    var hotels = $xml.find('Hotel');
    var result = [];
    for (var i = 0, len = hotels.length; i < len; i++) {
      var $hotel = $( hotels[i] );
      var name = $hotel.find('DisplayName').text();
      var id = $hotel.find('ID').text();
      var supplier = $hotel.find('SuppliersLowestPackagePrices Key')[0].textContent;
      var price = $hotel.find('SuppliersLowestPackagePrices Value')[0].textContent;
      var latitude = $hotel.find('GeoLocation Latitude').text();
      var longitude = $hotel.find('GeoLocation Longitude').text();
      result.push({
        displayName: name,
        id: id,
        supplier: supplier,
        price: Math.floor( price / searchParams.nights ),
        latitude: latitude,
        longitude: longitude
      });
    }
    var sessionId = $xml.find('SessionID').text();
    API.setSessionId( sessionId );
    return {prices: result};
  };


  var bookHotel = function( hotelId ){
    var url = '/html/booking.html?hotelId=' + hotelId + '&sessionId=' + API.getSessionId();
    chrome.tabs.create({url: url});
  };



  return {
    init: init,
    getPrices: getPrices
  };

})();

App.init();
