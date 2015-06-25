var View = (function(){

  var status;

  var selectors = {
    hotelDetails: '#hotel-details',
    packages: '#packages',
    passengers: '#guests',
    payment: '#payment',
    paymentForm: '#payment-form',
    creditCard: '#credit-card',
    book: '#submit'
  };

  var init = function(){
    var sessionId = getQueryVariable('sessionId');
    var hotelId = getQueryVariable('hotelId');
    var guestsCount = getQueryVariable('guests');

    status = new Helpers.Status( $('#status'), {
      show: {method: 'slideDown', params: []},
      hide: {method: 'slideUp', params: []}
    } );
    API.setSessionId( sessionId );
    API.getHotelDetails( {hotelId: hotelId}, processHotelDetails, processError );
    API.getPackageDetails( {hotelId: hotelId}, processPackageDetails, processError );
    renderForms( guestsCount );
    $( selectors.creditCard ).hide();
    $( selectors.payment ).hide();
    $( selectors.book ).click( bookHandler );
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


  var processError = function( errorText ){
    status.error( errorText, 10000 );
  };


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
    $( selectors.hotelDetails ).html( html );
  };


  var processPackageDetails = function( xml ){
    var $xml = $(xml);
    var json = JSON.parse( xml2json(xml, '  ') );
    var data = {};
    try {
      data = json['s:Envelope']['s:Body'].ServiceRequestResponse.ServiceRequestResult.HotelsSearchResponse.Result.Hotel.Packages.RoomsPackage;
    } catch (e) {
      console.error(e);
    }
    console.log(data);
    var html = '';
    if (data[0]) {
      for (var i = 0, len = data.length; i < len; i++) {
        var package = data[i];
        html += Mustache.to_html( $('#packages-template').html(), package );
      }
    }
    else {
      html += Mustache.to_html( $('#packages-template').html(), data );
    }
    $( selectors.packages ).append( html );
    $('.package').click( pickPackage );
  };


  var renderForms = function( guestsCount ){
    var html = '';
    for (var i = 0; i < guestsCount; i++) {
      var guid = Helpers.guid();
      var guestForm = Mustache.to_html( $('#guest-template').html(), {
        guid: guid
      } );
      html += guestForm;
    }
    $( selectors.passengers ).html( html );
  };


  var pickPackage = function(){
    var $this = $(this);
    $('.package').removeClass('selected');
    $this.addClass('selected');
    $( selectors.payment ).show();
    $( selectors.paymentForm ).html('<img src="/img/spinner16.gif"/>');
    var packageId = $this.data('package-id');
    var hotelId = $this.data('hotel-id');

    API.getPaymentPreferences( {
      packageId: packageId,
      hotelId: hotelId
    }, function( xml ){
      var res = [];
      var prefs = xml.querySelectorAll('PaymentPreference Type');
      for (var i = 0, len = prefs.length; i < len; i++) {
        var pref = prefs[i];
        var type = pref.textContent;
        res.push( {type: type, name: type.replace(/External|Internal/, '')} );
      }
      updatePaymentMethods( res );
    });
    Order.setPackage({
      packageId: $this.data('package-id'),
      hotelId: $this.data('hotel-id'),
      roomId: $this.data('room-id'),
      price: $this.data('price'),
      cardRequired: $this.data('card-required')
    });
  };


  var updatePaymentMethods = function( prefs ){
    var html = Mustache.to_html( $('#payment-prefs-template').html(), prefs );
    $( selectors.paymentForm )
      .html( html )
      .find('input')
      .click(function(e){
        var paymentMethod = this.value;
        Order.setPaymentMethod( paymentMethod );
        if (paymentMethod.match(/CreditCard/)) $( selectors.creditCard ).show();
        else $( selectors.creditCard ).hide();
      });
    $( selectors.paymentForm + ' input')[0].click();
  };


  var bookHandler = function(){
    var data = Order.getData();
    API.makeBooking( data, function( response ){
      var text = $('<textarea />').text(response).html();
      status.success( '<pre>' + text + '</pre>' );
    }, processError );
    console.log(data);
  };


  return {
    init: init,
    status: status
  };

})();


/**
 * Order
 */

var Order = (function(){

  var passengers = [];
  var package = {};
  var paymentMethod = '';

  var getPassengers = function(){
    passengers = [];
    $('.passenger').each(function(){
      var data = {};
      var $this = $(this);
      data.guid = $this.data('guid');
      data.title = $this.find('[name=title]').val();
      data.firstname = $this.find('[name=firstname]').val();
      data.lastname = $this.find('[name=lastname]').val();
      data.type = $this.find('[name=type]').val();
      passengers.push(data);
    });
    console.log(passengers);
    return passengers;
  };


  var setPackage = function( data ){
    package = data;
  };

  var setPaymentMethod = function( value ){
    paymentMethod = value;
  };

  var getData = function(){
    getPassengers();
    var data = {
      package: package,
      passengers: passengers,
      paymentMethod: paymentMethod
    };
    return data;
  };


  return {
    setPackage: setPackage,
    setPaymentMethod: setPaymentMethod,
    getData: getData
  };

})();


/**
 * Credit Card
 */

var CreditCard = (function(){

  getData = function(){
    var $form = $('#credit-card-form');
    var data = {};
    data.cardType = $form.find('[name=card-type]').val();
    data.name = $form.find('[name=card-holder-name]').val();
    data.cardNumber = $form.find('[name=card-number]').val();
    data.cvv = $form.find('[name=cvv]').val();
    data.expiryMonth = parseInt( $form.find('[name=expiry-month]').val() );
    data.expiryYear = parseInt( $form.find('[name=expiry-year]').val() );
    data.expireDate = new Date( Date.UTC(data.expiryYear, data.expiryMonth) )
      .toISOString()
      .replace(/\.000Z/, '');
    return data;
  };


  return {
    getData: getData
  };

})();


/**
 * Helpers
 */

var Helpers = window.Helpers || {};

Helpers.guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();


View.init();
