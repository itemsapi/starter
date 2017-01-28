var requestCatalog = function(data) {
  data = _.extend({
    success: function(result, status) {
      jQuery("#content").html(result);
      History.pushState(null, document.title, decodeURIComponent(data.url));
    },
    dataType: 'html'
  }, data);
  jQuery.ajax(data);
}


var onAggregationClick = function(element, aggregation, value) {
  var checked = jQuery(element).is(':checked');
  var uri = getUpdatedAggregationsUrl({
    key: aggregation,
    value: value,
    checked: checked
  });

  requestCatalog({
    url: uri.href()
  });
}



var removeFilter = function(key, value) {
  var uri = getUpdatedAggregationsUrl({
    key: key,
    value: value,
    checked: false
  });
  requestCatalog({
    url: uri.href()
  });
  //window.location.href = uri.href();
}

var getUpdatedAggregationsUrl = function(options) {
  var uri = options.uri || new URI();
  var qs = uri.search(true);
  var filters = JSON.parse(qs.filters || '{}');



  var aggregation = options.key;
  var value = options.value;
  var checked = options.checked;

  if (!filters[aggregation]) {
    filters[aggregation] = [];
  }

  var chunks = uri.directory().split('/');
  if (chunks.length > 2 && chunks[1] === 'filter') {
    if (typeof globalconfig != 'undefined' && globalconfig.filter) {
      filters[globalconfig.filter.key] = [globalconfig.filter.val]
    } else {
      filters[chunks[2]] = [];
      filters[chunks[2]].push(decodeURIComponent(uri.filename()))
    }
  }

  if (uri.path() !== '/catalog' && uri.path() !== '/') {
    uri.path('/catalog');
  }

  if (checked === true) {
    filters[aggregation].push(value)
    filters[aggregation] = _.uniq(filters[aggregation]);
  } else {
    var index = filters[aggregation].indexOf(value);
    filters[aggregation].splice(index, 1);
  }

  qs.filters = JSON.stringify(filters);
  delete qs['page'];
  uri.search(qs);
  return uri;
}

jQuery(document).ready(function() {
  $('.previous-page').on('click', function(event) {
    History.back()
    event.preventDefault()
  })
})
