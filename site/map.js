
// TODO Add a reset button
const width = window.innerWidth
const height = window.innerHeight
draw(width, height)

function drawLegend(svg) {
  var legendText = ["", "10%", "", "15%", "", "20%", "", "25%"];
  var legendColors = ["#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506"];

  var legend = svg.append("g")
    .attr("id", "legend");

  var legenditem = legend.selectAll(".legenditem")
    .data(d3.range(8))
    .enter()
    .append("g")
    .attr("class", "legenditem")
    .attr("transform", function (d, i) { return "translate(" + i * 31 + ",0)"; });

  legenditem.append("rect")
    .attr("x", width - 240)
    .attr("y", -7)
    .attr("width", 30)
    .attr("height", 6)
    .attr("class", "rect")
    .style("fill", function (d, i) { return legendColors[i]; });

  legenditem.append("text")
    .attr("x", width - 240)
    .attr("y", -10)
    .style("text-anchor", "middle")
    .text(function (d, i) { return legendText[i]; });

}

function draw(width, height) {
  const svg = d3.select("svg")
  svg.selectAll("*").remove()
  svg
    .attr("viewBox", [0, 0, width, height])
  drawLegend(svg);

  const g = svg.append("g")

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const zoom = d3.zoom()
    .scaleExtent([1, 20]).translateExtent([[-(width / 2), -(height / 2)], [width + (width / 2), height + (height / 2)]])
    .on("zoom", zoomed)
  reset()

  function zoomed() {
    const { transform } = d3.event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }

  function reset() {
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
  }

  // var promises = [
  //   d3.json("https://raw.githubusercontent.com/shyrwinsia/covidph-notebook/master/visualization/ph.json")
  // ]

  var promises = [
    d3.json("ph.json")
  ]

  Promise.all(promises).then(ready)

  function ready([ph]) {
    var m = topojson.feature(ph, ph.objects.ph).features
    var p = d3.geoIdentity()
      .reflectY(true)
      .translate([width / 2, height])
    var path = d3.geoPath().projection(p)
    var munipath = g.append("g")
      .attr("stroke", "#ccc")
      .selectAll("path")
      .data(m)
      .enter()
      .append("path")
      .attr("fill", function (d) {
        if (d.properties.TYPE_2 == "Waterbody")
          return "rgba(255, 255, 255, 0.0)"
        else if (d.properties.NAME_2 == "Cebu City")
          return "red"
        else
          return "#eee"
      })
      .attr("d", path)


    munipath
      .on("mouseover", function (d) {
        tooltip.transition()
          .duration(250)
          .style("opacity", 1)

        if (d.properties.TYPE_2 == "Waterbody")
          tooltip.html(
            "<p>" + d.properties.NAME_2 + "</p>"
          )
            .style("left", (d3.event.pageX + 15) + "px")
            .style("top", (d3.event.pageY - 28) + "px")

        else
          tooltip.html(
            "<p>" + d.properties.NAME_2 + "</p>" +
            "<table><tbody><tr><td class='wide'>Total cases:</td><td>200</td></tr>" +
            "<tr><td>Test done:</td><td>200</td></tr>" +
            "<tr><td>Population:</td><td>400,000</td></tr></tbody></table>"
          )
            .style("left", (d3.event.pageX + 15) + "px")
            .style("top", (d3.event.pageY - 28) + "px")

        d3.select(this).attr("opacity", "0.6")
      })
      .on("mouseout", function (d) {
        tooltip.transition()
          .duration(250)
          .style("opacity", 0)

        d3.select(this).attr("opacity", "1")
      });


    svg.call(zoom);
  }
}


function redraw() {
  const width = window.innerWidth
  const height = window.innerHeight
  draw(width, height)
}

window.addEventListener("resize", redraw);