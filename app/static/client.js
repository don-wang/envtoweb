var app = angular.module('App',[]);

// Change angular html template tags to avoid conflict with flask
app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});

app.controller('Ctrl', function($scope, socket) {


    // scoket listenters
    socket.on('status', function (data) {
        // application logic ....
        $scope.status = data.msg;
    });

    // scoket listenters
    socket.on('push', function (data) {
        // application logic ....
        d = JSON.parse(data);
        // d = data;

        // var a = d.data.split(",");
        $scope.data = d;
        // $scope.data.avePre
        console.log(d);
    });

    $scope.count = function(){
        socket.emit('count');
        return false;
    }
    $scope.clear = function(){
        socket.emit('clear');
        return false;
    }
    $scope.tempToColor = function(temp){
      if (temp<26) {
        return "bg-info";
      } else if (temp > 26 && temp < 29) {
        return "bg-warning";
      } else {
        return "bg-danger";
      }
    }


// PMV
  var pi = Math.PI; var iR=80;  var oR=120;
  var margin = {top: 20, right: 5, bottom: 20, left: 5},
    width = 380 - margin.left - margin.right,
    height = 280 - margin.top - margin.bottom;
  var cur_color = 'limegreen';  var new_color, hold;
  var max = 4, min = 0, current = 0;
  var arc = d3.svg.arc().innerRadius(iR).outerRadius(oR).startAngle(-90 * (pi/180)); // Arc Defaults
  // Place svg element
  var svg = d3.select("#pmv").append("svg").attr("width", width).attr("height", height)
    .append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
  var background = svg.append("path").datum({endAngle:  90 * (pi/180)}).style("fill", "#ddd").attr("d", arc);// Append background arc to svg
  var foreground = svg.append("path").datum({endAngle: -90 * (pi/180)}).style("fill", cur_color).attr("d", arc); // Append foreground arc to svg
  var max = svg.append("text").attr("transform", "translate("+ (iR + ((oR - iR)/2)) +",15)") // Display Max value
  .attr("text-anchor", "middle").style("font-family", "Helvetica").text(max) // Set between inner and outer Radius
  // Display Min value
  var min = svg.append("text").attr("transform", "translate("+ -(iR + ((oR - iR)/2)) +",15)") // Set between inner and outer Radius
              .attr("text-anchor", "middle").style("font-family", "Helvetica").text(min)
  // Display Current value
  var current = svg.append("text").attr("transform", "translate(0,"+ -(iR/4) +")") // Push up from center 1/4 of innerRadius
              .attr("text-anchor", "middle").style("font-size", "50").style("font-family", "Helvetica").text(current)
  // Update every x seconds
  setInterval(function() {
  pmv = $scope.data.pmv;
  pmv = pmv > 4?4:pmv;
  pmv = pmv < 0?0:pmv;
  var num = pmv; var numPi = (num - 2)  * (pi/4);// Get value
  if(num  < 1) {new_color = 'limegreen';} else if(num  < 2 && num > 1) {new_color = 'orange';} else {new_color = 'red';} // Get new color
  current.transition().text(pmv);// Text transition
  // max.transition().text(Math.floor($scope.middle + $scope.range/2));// Text transition
  // min.transition().text(Math.floor($scope.middle - $scope.range/2));// Text transition
  // Arc Transition
  foreground.transition().duration(750).styleTween("fill", function() { return d3.interpolate(new_color, cur_color); }).call(arcTween, numPi);
    // Set colors for next transition
  hold = cur_color; cur_color = new_color; new_color = hold;
  d3.select("#backrect").attr("fill", new_color);
  }, 1000); // Repeat every 1s
  function arcTween(transition, newAngle) {
    transition.attrTween("d", function(d) {var interpolate = d3.interpolate(d.endAngle, newAngle);
              return function(t) {d.endAngle = interpolate(t);  return arc(d);  };  }); } // Update animation


// Temp
var n = 50,
    duration = 200,
    now = new Date(Date.now() - duration),
    count = 0,
    data = d3.range(n).map(function() { return 0; });
var margin = {top: 20, right: 30, bottom: 20, left: 10},
    width = 340 - margin.left - margin.right,
    height = 240 - margin.top - margin.bottom;

// Radi
var x2 = d3.time.scale()
    .domain([now - (n - 2) * duration, now - duration])
    .range([0, width]);

var y2 = d3.scale.linear()
    .domain([22, 34])
    .range([height, 0]);

var line2 = d3.svg.line()
    .interpolate("basis")
    .x(function(d, i) { return x2(now - (n - 1 - i) * duration); })
    .y(function(d, i) { return y2(d); });

var svgRadi = d3.select("#radi").append("svg")
    .attr("id", "linechartRadi")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


svgRadi.append("defs").append("clipPath")
    .attr("id", "clipRadi")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var axis = svgRadi.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(x2.axis = d3.svg.axis().scale(x2).orient("bottom"));

svgRadi.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + " ,0)")
    .call(y2.axis= d3.svg.axis().scale(y2).orient("right"));

var path = svgRadi.append("g")
    .attr("clip-path", "url(#clipRad)")
  .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line2);

d3.select("#radi svg").select("g").append("foreignObject")
    .attr("id", "charap")
    .attr("width", "15px")
    .attr("height", "20px")
    .attr("x",-10)
    .attr("y",-10)
    .html("<p class='chara'></p>");

drawRadi()
function drawRadi() {

  var d = $scope.data?$scope.data.radi:0;
  // push a new data point onto the back
  now = new Date();
  x2.domain([now - (n - 2) * duration, now - duration]);

  // y.domain([d3.max(data), d3.min(data)])
  //   .range([height, 0]);

  data.push(d);

  var first = Math.floor(d3.max(d3.values(data)));
  svgRadi.selectAll("g.y.axis")
      .call(y2.axis);

  // redraw the line, and slide it to the left
  svgRadi.select(".line")
      .attr("d", line2)
      .attr("transform", null);
  // slide the x-axis left
  axis.transition()
      .duration(duration)
      .ease("linear")
      .call(x2.axis);

  // slide the line left
  path.transition()
      .duration(duration)
      .ease("linear")
      .attr("transform", "translate(" + x2(now - (n - 1) * duration) + ")")
      .each("end", drawRadi);

charay = height - (data[24] - 24)/12*height - 50;
d3.select("#charap").transition()
        .duration(100)
        .attr("x",width /2 - 15)
        .attr("y", charay);
        // .attr("transform","translate(150,"+ charay+")");
  // pop the old data point off the front
  data.shift();
}
//
});


app.factory('socket', function ($rootScope) {
  var socket = io.connect('http://' + document.domain + ':' + location.port + '/main');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

