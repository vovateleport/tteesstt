var _dict = {}; //dict from last response
var _nodeInput = $('#nodeInput');
var _nodeResult = $('#nodeResult');

$('#nodeTest').click(nodeTest_click);
$('#nodeButton').click(nodeButton_click);

_nodeResult.mouseover(nodeResult_mouseover);

function nodeResult_mouseover(event){
  var target = $(event.target);
  if (target.is('span')){
    var key = 'k_' + target.text().toLowerCase();
    if (_dict.hasOwnProperty(key)){
      var json = _dict[key];
      $(target).tooltip({
        items: "*",
        content : buildTooltipHtml(json),
        close: function() {
          $(this).tooltip('destroy');
        }
      });
      $(target).tooltip('open');
    }
  }
}

function buildTooltipHtml(jsonText){
  var data = $.parseJSON(jsonText);
  var html = [];
  html.push('<ul class="ui-helper-reset tooltipList">');
  for(var i=0;i<data.length;i++){
    var di=data[i];
    html.push('<li>');
    html.push(
      $.map(di, function(el){
        return htmlEscape(el);}
      ).join(', ')
    );
    html.push('</li>');
  }
  html.push('</ul>');
  return html.join('');
}

function nodeButton_click(event){
  event.preventDefault();
  var text = _nodeInput.val();
  $.ajax({
    type: "POST",
    url: '/translate',
    data: {data: text},
    complete: translate_cb
  });
}

function translate_cb(jqXHR){
  jqXHR.done(function() {
    if (jqXHR.responseJSON) {
      // $('#nodeDebug').html(JSON.stringify(jqXHR.responseJSON.output_dict, null, 2));
      _dict = jqXHR.responseJSON.output_dict||{};
      _nodeResult.html(jqXHR.responseJSON.output_text);
    }})
  .fail(function(err) {
    console.log('error', JSON.stringify(err,null,2));
  });
}

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function nodeTest_click(event){
  event.preventDefault();
  $.ajax({type: 'GET', url: '/sample'})
    .done(function(data) {
      _nodeInput.val(data.data);
    })
    .fail(function(err) {
      console.log('error', JSON.stringify(err,null,2));
    })
}
