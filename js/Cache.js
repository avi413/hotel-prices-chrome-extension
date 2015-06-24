var Cache = (function(){

  var cache = {};
  var cacheTime = 1800;

  var get = function( key ){
    var now = Date.now();
    if (cache[key] && now - cache[key].timestamp <= cacheTime*1000) {
      //console.log('From cache', key, cache[key].response);
      return cache[key].response;
    }
    else {
      delete cache[key];
    }
    return false;
  };


  var set = function( key, response ){
    var now = Date.now();
    if (cache[key] && now - cache[key].timestamp <= cacheTime*1000) {
      return;
    }
    //console.log('Set cache', key, response);
    cache[key] = {
      timestamp: Date.now(),
      response: response
    };
  };


  return {
    get: get,
    set: set
  };

})();
