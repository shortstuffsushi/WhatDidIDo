/////////////////////
/// draw pie chart //
/////////////////////

function drawpie(data) {

    var graphdata = data.contributors;

    var div_location = '#piechart';

    var div_width = Math.min($(div_location).width(),500);

    var width = div_width;
    var height = div_width;
    var radius = Math.min(width, height) / 2;
    var donutWidth = (div_width * .15);
    var legendRectSize = 18;
    var legendSpacing = 4;

    var color = d3.scale.category10();

    var svg = d3.select(div_location)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + (width / 2) + 
      ',' + (height / 2) + ')');

    var arc = d3.svg.arc()
    .innerRadius(radius - donutWidth)
    .outerRadius(radius);

    var pie = d3.layout.pie()
    .value(function(d) { return d.lineCount; })
    .sort(null);

    var tooltip = d3.select(div_location)
    .append('div')
    .attr('class', 'tooltip');

    tooltip.append('div')
    .attr('class', 'label');

    tooltip.append('div')
    .attr('class', 'lineCount');

    tooltip.append('div')
    .attr('class', 'percent');


    graphdata.forEach(function(d) {
      d.enabled = true;
    });

    var path = svg.selectAll('path')
      .data(pie(graphdata))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', function(d, i) { 
        return color(d.data.email); 
      })
      .each(function(d) { this._current = d; });

    path.on('mouseover', function(d) {
      var total = d3.sum(graphdata.map(function(d) {
        return (d.enabled) ? d.lineCount : 0;
      }));
      var percent = Math.round(1000 * d.data.lineCount / total) / 10;
      tooltip.select('.label').html(d.data.email);
      tooltip.select('.lineCount').html(d.data.lineCount); 
      tooltip.select('.percent').html(percent + '%'); 
      tooltip.style('display', 'block');
    });

    path.on('mouseout', function() {
      tooltip.style('display', 'none');
    });


    path.on('mousemove', function(d) {
      tooltip.style('top', (d3.event.pageY + 1) + 'px')
        .style('left', (d3.event.pageX + 1) + 'px');
    });

      
    var legend = svg.selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d, i) {
        var height = legendRectSize + legendSpacing;
        var offset =  height * color.domain().length / 2;
        var horz = -7 * legendRectSize;
        var vert = i * height - offset;
        return 'translate(' + horz + ',' + vert + ')';
      });

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)                                   
      .style('fill', color)
      .style('stroke', color)
      .on('click', function(email) {
        var rect = d3.select(this);
        var enabled = true;
        var totalEnabled = d3.sum(graphdata.map(function(d) {
          return (d.enabled) ? 1 : 0;
        }));
        
        if (rect.attr('class') === 'disabled') {
          rect.attr('class', '');
        } else {
          if (totalEnabled < 2) return;
          rect.attr('class', 'disabled');
          enabled = false;
        }

        pie.value(function(d) {
          if (d.email === email) d.enabled = enabled;
          return (d.enabled) ? d.lineCount : 0;
        });

        path = path.data(pie(graphdata));

        path.transition()
          .duration(750)
          .attrTween('d', function(d) {
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
              return arc(interpolate(t));
            };
          });
      });
      
    legend.append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function(d) { return d; });

};

/*
///////////////////////
/// draw  steamgraph //
///////////////////////

var bar_div = "#steamgraph";

var div_width = $(bar_div).width();

var n = 5, // number of layers
    m = 10, // number of samples per layer
    stack = d3.layout.stack().offset("wiggle"),
    layers0 = stack(d3.range(n).map(function() { return bumpLayer(m); })),
    layers1 = stack(d3.range(n).map(function() { return bumpLayer(m); }));

console.log(bumpLayer(m));
console.log(layers0);
console.log(layers1);

var width = div_width,
    height = 500;

var x = d3.scale.linear()
    .domain([0, m - 1])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, d3.max(layers0.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
    .range([height, 0]);

var color = d3.scale.category10();

var area = d3.svg.area()
    .x(function(d) { return x(d.x); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });

var svg = d3.select(bar_div).append("svg")
    .attr("width", width)
    .attr("height", height);

svg.selectAll("path")
    .data(layers0)
  .enter().append("path")
    .attr("d", area)
    .style("fill", function() { return color(Math.random()); });

function transition() {
  d3.selectAll("path")
      .data(function() {
        var d = layers1;
        layers1 = layers0;
        return layers0 = d;
      })
    .transition()
      .duration(2500)
      .attr("d", area);
}

// Inspired by Lee Byron's test data generator.
function bumpLayer(n) {

  function bump(a) {
    var x = 1 / (.1 + Math.random()),
        y = 2 * Math.random() - .5,
        z = 10 / (.1 + Math.random());
    for (var i = 0; i < n; i++) {
      var w = (i / n - y) * z;
      a[i] += x * Math.exp(-w * w);
    }
  }

  var a = [], i;
  for (i = 0; i < n; ++i) a[i] = 0;
  for (i = 0; i < 5; ++i) bump(a);
  return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
}

*/