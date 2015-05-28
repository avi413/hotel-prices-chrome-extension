(function(){

  var prevUrl = '';
  var priceList = [];
  var isFetchingPrices = false;
  var currentCity = '';


  var init = function(){
    initMessaging();
    initHotelListObserver();
    initParamsChangeObserver();
    processPage();
  };


  /**
   * ================== Communicating with background
   */

  var initMessaging = function(){
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
      if (request.cmd === 'price_list') {
        if (document.location.href !== request.data.url) return;
        priceList = request.data.prices;
        isFetchingPrices = false;
        updatePrices();
      }
    });
  };


  var getPrices = function( params ){
    priceList = {};
    isFetchingPrices = true;
    params.url = document.location.href;
    chrome.runtime.sendMessage({
      cmd: 'get_prices',
      data: params
    }, function( response ){
      console.log(response);
    });
  };


  /**
   * ================== Mutation Observer:
   * Changing "display" property of "#js_pricesearch_transparency" means that
   * hotellist was updated and therefore some search parameters was changed
   */

  var initParamsChangeObserver = function(){
    var target = document.querySelector('#js_pricesearch_transparency');
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var node = mutation.target;
        var style = getComputedStyle(node);
        if (style.display === 'none') {
          if (prevUrl === document.location.href) return;
          prevUrl = document.location.href;
          var searchParams = getSearchParams();
          console.log(searchParams);
          getPrices( searchParams );
        }
      });
    });
     var config = {
      subtree: false, childList: false, characterData: false,
      attributes: true, attributeFilter: ["style"]
    };
    observer.observe(target, config);
  };


  /**
   * ================== Mutation Observer
   */
  var initHotelListObserver = function(){
    var target = document.querySelector('.hotellist');

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          processChildList(mutation.addedNodes);
        }
      });
    });

    var config = { subtree: true, childList: true, characterData: false};
    observer.observe(target, config);
  };


  var processChildList = function(children){
    for (var i = 0, len = children.length; i < len; i++) {
      var node = children[i];
      processNode(node);
    }
  };


  var processNode = function(node){
    // ignore text nodes
    if (node.nodeType === 3) return;
    var $node = $(node);
    if ( $node.hasClass('hotel') && $node.hasClass('item') ) {
      processHotelItem( node );
    }
  };


  /**
   * ================== Page processing
   */

  var getSearchParams = function(){
    var city = $('#js_querystring').val();
    var checkin = getQueryParam('aDateRange[arr]');
    var checkout = getQueryParam('aDateRange[dep]');
    // single - 1, double - 7, family - 9
    // for now just single or double
    var guests = getQueryParam('iRoomType') > 1 ? 2 : 1;
    currentCity = city;
    return {
      city: city,
      checkin: checkin,
      checkout: checkout,
      guests: guests
    };
  };


  var getQueryParam = function( key ){
    // ?aDateRange[arr]=2015-06-14&aDateRange[dep]=2015-06-16&iRoomType=7&bIsTotalPrice=false&iPathId=8514&iGeoDistanceItem=0&iViewType=0&bIsSeoPage=false&bIsSitemap=false&
    var query = decodeURIComponent( document.location.search.substr(1) );
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == key) {
        return pair[1];
      }
    }
    return(false);
  };


  var updatePrices = function(){
    var $hotels = $('.hotel.item');
    $hotels.each(function(index, item){
      processHotelItem( item );
    });
  };


  var processPage = function(){
    var $hotels = $('.hotel.item');
    if ($hotels.length) {
      var searchParams = getSearchParams();
      getPrices( searchParams );
      for (var i = 0, len = $hotels.length; i < len; i++) {
        var item = $hotels[i];
        processHotelItem( item );
      }
    }
  };


  var template = [
    '<span class="display-name">{{displayName}}</span>',
    ' - ',
    '<span class="supplier">{{supplier}}</span>',
    ' - ',
    '<span class="price">{{price}} EUR</span>',
    ' <span class="distance">({{distance}}m)</span>',
  ].join('');


  var processHotelItem = function( item ){
    var $item = $(item);
    var $dataNode = $( $item.find('[data-name]')[0] );
    var displayName = $dataNode.data('name');
    var name = displayName.toLowerCase();
    var lat = $dataNode.data('lat');
    var lng = $dataNode.data('lng');
    var html = '';
    var statusClassName = 'default';
    if (isFetchingPrices) {
      var spinnerSrc = chrome.extension.getURL('/img/spinner16.gif');
      html = '<img src="' + spinnerSrc + '"/> <span>fetching prices...<span>';
      statusClassName = 'fetching';
    }
    else {
      var data = matchHotel(displayName, lat, lng); // priceList[name];
      if (data) {
        var hotel = data.hotel;
        statusClassName = data.status;
        html = template;
        var params = {
          displayName: hotel.displayName,
          supplier: hotel.supplier,
          price: hotel.price,
          distance: data.distance
        };
        for (var key in params) {
          var re = new RegExp('{{' + key + '}}', 'g');
          html = html.replace( re, params[key]);
        }
      }
      else {
        html = '';
        statusClassName = 'not_found';
      }
    }
    updateHotelItemInfo( item, html, statusClassName );
  };


  var updateHotelItemInfo = function( item, html, className ){
    var $item = $(item);
    var infoblockClassName = 'extension-output';

    var $infoblock = $item.find( '.' + infoblockClassName);
    if (!$infoblock.length) {
      $infoblock = $('<div/>')
        .addClass( infoblockClassName )
        .html( html )
        .appendTo( $item );
    }
    else $infoblock.html( html );
    $infoblock[0].className = infoblockClassName + ' ' + className;
  };


  /**
   * Matches given hotel with list of hotels received from API
   * @param  {string} tName - trivago hotel name
   * @param  {float} tLat  - trivago latitude
   * @param  {float} tLng  - trivago longitude
   * @return {object}      - {hotel: object, distance: int, status: string}
   */
  var matchHotel = function( tName, tLat, tLng ){
    tName = formatHotelName( tName );
    var minDistance = 1000000;
    var closestHotel;
    var status;
    for (var i = 0, len = priceList.length; i < len; i++) {
      var item = priceList[i];
      var pName = formatHotelName( item.displayName );
      var distance = Helpers.distance(tLat, tLng, item.latitude, item.longitude, 'K');
      distance = parseInt( (distance * 1000).toFixed(0) );
      if (distance < minDistance) {
        minDistance = distance;
        closestHotel = item;
      }

      // Exact match
      if (tName === pName) {
        status = distance < 100 ? 'found_by_name' : 'found_by_name marked';
        return {hotel: item, distance: distance, status: status};
      }
      // By similar names (>50% words match)
      if (distance < 100) {
        var tWords = tName.split(/\s+/);
        var pWords = pName.split(/\s+/);
        var intersect = $(pWords).filter(tWords);
        if (intersect.length / tWords.length > 0.5 || intersect.length / pWords.length > 0.5) {
          return {hotel: item, distance: distance, status: 'found_by_similar_name'};
        }
      }
    }
    return {hotel: closestHotel, distance: minDistance, status: 'not_found'};
  };


  /**
   * Unify hotel name before matching
   */
  var formatHotelName = function( name ){
    var res = name.toLowerCase();
    res = res.replace(/[-]/g, ' ');
    res = res.replace(/[']/g, '');
    res = res.replace(/(^|\s)hotel(\s|$)/, ' ');
    //var re = new RegExp('(^|\\s)' + currentCity.toLowerCase() + '(\\s|$)', 'g');
    //res = res.replace(re, ' ');
    res = $.trim(res);
    return res;
  };


  return {
    init: init
  };


})().init();
