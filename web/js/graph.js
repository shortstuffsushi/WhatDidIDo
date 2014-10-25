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


///////////////////////
/// draw  steamgraph //
///////////////////////

function drawsteamgraph(commits) {
  var steamChartData = [ ];
  var steamContributorMap = { };

  $.each(commits, function(commitIndex, commit) {
    $.each(commit.contributors, function(contributorIndex, contributor) {
      var steamContributorObj = steamContributorMap[contributor.email];
      if (!steamContributorObj) {
        steamContributorObj = {
          name: contributor.email,
          values: [ ]
        };

        steamContributorMap[contributor.email] = steamContributorObj;
        steamChartData.push(steamContributorObj);
      }

      steamContributorObj.values.push({
        x: commitIndex,//.commit.date,
        y: contributor.lineCount
      });
    });
  });

  var steamGraphDivId = '#steamgraph';
  var divWidth = $(steamGraphDivId).width();

  var stack = d3.layout.stack()
      .offset('wiggle')
      .values(function(d) { return d.values; });

  var layers = stack(steamChartData);

  var width = divWidth,
      height = 500;

  var x = d3.scale.ordinal()
      .range([ 0, width ]);

  var y = d3.scale.linear()
      .range([ height, 0 ]);

  var color = d3.scale.category10();

  var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });

  var svg = d3.select(steamGraphDivId)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

  svg.selectAll('path')
      .data(layers)
    .enter().append('path')
      .attr('d', function(d) { return area(d.values); })
      .style('fill', function() { return color(Math.random()); });
};
