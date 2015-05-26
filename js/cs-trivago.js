(function(){

  var prevUrl = '';
  var priceList = {};
  var isFetchingPrices = false;


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


  var processHotelItem = function( item ){
    var $item = $(item);
    var name = $item.find('.item_name').text();
    var html = '';
    if (isFetchingPrices) {
      var spinnerSrc = chrome.extension.getURL('/img/spinner16.gif');
      html = '<img src="' + spinnerSrc + '"/> fetching prices...';
    }
    else {
      html = priceList[name];
      if (!html) html = 'not found';
    }
    updateHotelItemInfo( item, html );
  };


  var updateHotelItemInfo = function( item, html ){
    var $item = $(item);
    var infoblockClassName = 'extension-output';

    var $infoblock = $item.find( '.' + infoblockClassName);
    if (!$infoblock.length) {
      $infoblock = $('<div/>')
        .addClass( infoblockClassName )
        .css({
          'background': '#ffe0e0',
          'padding': '10px'
        })
        .html( html )
        .appendTo( $item );
    }
    else $infoblock.html( html );
  };



  return {
    init: init
  };


})().init();
