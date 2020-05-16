
// TODO Add a reset button
const width = window.innerWidth
const height = window.innerHeight
draw(width, height)

var legendText = ["", "1", "", "10", "", "100", "", "1000+"]
var legendColors = ["#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506"]

var color = d3.scaleThreshold()
  .domain([0, 1, 5, 10, 50, 100, 500])
  .range(legendColors);

function drawLegend(svg, width) {
  svg.selectAll("#legend").remove()
  var legend = svg.append("g")
    .attr("id", "legend");

  var legenditem = legend.selectAll(".legenditem")
    .data(d3.range(8))
    .enter()
    .append("g")
    .attr("class", "legenditem")
    .attr("transform", function (d, i) { return "translate(" + i * 31 + ",0)"; });

  legenditem.append("rect")
    .attr("x", width - 300)
    .attr("y", 60)
    .attr("width", 30)
    .attr("height", 6)
    .attr("class", "rect")
    .style("fill", function (d, i) { return legendColors[i]; });

  legenditem.append("text")
    .attr("x", width - 300)
    .attr("y", 80)
    .style("text-anchor", "middle")
    .style("fill", "rgba(255,255,255,0.8")
    .style("font-size", "0.6em")
    .text(function (d, i) { return legendText[i]; });

  legend.append("text")
    .attr("x", width - 235)
    .attr("y", 50)
    .style("text-anchor", "middle")
    .style("fill", "rgba(255,255,255,0.8")
    .style("font-size", "0.7em")
    .text("Cases per 100,000 people")
}

function draw(width, height) {
  const svg = d3.select("svg")
  svg.selectAll("*").remove()
  svg
    .attr("viewBox", [0, 0, width, height])

  const g = svg.append("g")

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)

  console.log("w:" + width + " h:" + height);

  const zoom = d3.zoom()
    .scaleExtent([1 / 1.5, 10]).translateExtent([
      [-(width * 0.60), -(height * 0.80)],
      [width + (width * 0.60), height + (height * 0.80)]
    ])
    .on("zoom", zoomed)
  reset()

  function zoomed() {
    const { transform } = d3.event
    g.attr("transform", transform)
    g.attr("stroke-width", 1 / transform.k)
  }

  function reset() {
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    )
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // TODO Optimize for fetching
  // TODO Optimize zoom and pan
  // Manila PH1339[00000]
  // var promises = [
  //   d3.json("https://raw.githubusercontent.com/shyrwinsia/covidph-notebook/master/visualization/ph.json")
  // ]

  var cases = d3.map();
  var promises = [
    d3.json("ph.json"),
    d3.csv("data.csv", function (d) {
      cases.set(d.admin_code, d)
    })
  ]

  Promise.all(promises).then(ready)

  function ready([ph]) {
    console.log("Drawing")
    var m = topojson.feature(ph, ph.objects.ph).features
    var p = d3.geoIdentity()
      .reflectY(true)
      .translate([width / 2, height])
    var path = d3.geoPath().projection(p)
    var munipath = g.append("g")
      .attr("stroke", "#081d33")
      .attr("fill", "#444444")
      .selectAll("path")
      .data(m)
      .enter()
      .append("path")
      .attr("fill", function (d) {
        if (d.properties.TYPE_2 == "Waterbody")
          return "rgba(255, 255, 255, 0.0)"
        else {
          let value = cases.get(d.properties.ADMIN_CODE)
          if (!value) return "black"
          else if (value == 0) return "#FFFFFF"
          else return color(value.norm_cases)

          // if (value < 1)
          //   value = Math.round(num * 100) / 100
        }
      })
      .attr("d", path)

    munipath
      .on("mouseover", function (d) {
        tooltip.transition()
          .duration(250)
          .style("opacity", 0.9)

        if (d.properties.TYPE_2 == "Waterbody")
          tooltip.html(
            "<p>" + d.properties.NAME_2 + "</p>"
          )
            .style("left", (d3.event.pageX + 15) + "px")
            .style("top", (d3.event.pageY - 28) + "px")

        else {
          var mun = cases.get(d.properties.ADMIN_CODE)
          if (mun)
            tooltip.html(
              "<p>" + d.properties.NAME_2 + ", " + d.properties.NAME_1 + "</p>" +
              "<table><tbody>" +
              "<tr><td class='wide'>Total Cases:</td><td class='data'>" + numberWithCommas(mun.cases) + "</td></tr>" +
              "<tr><td>per 100,000:</td><td class='data'>" + numberWithCommas(mun.norm_cases) + "</td></tr>" +
              "<tr><td>Active:</td><td class='data'>" + numberWithCommas(mun.active) + "</td></tr>" +
              "<tr><td>Recovered:</td><td class='data'>" + numberWithCommas(mun.recovered) + "</td></tr>" +
              "<tr><td>Deaths:</td><td class='data'>" + numberWithCommas(mun.deaths) + "</td></tr>" +
              "<tr><td>Population:</td><td class='data'>" + numberWithCommas(mun.population) + "</td></tr>" +
              "</tbody></table>"
            )
              .style("left", (d3.event.pageX + 15) + "px")
              .style("top", (d3.event.pageY - 28) + "px")
          else
            tooltip.html(
              "<p>" + d.properties.NAME_2 + ", " + d.properties.NAME_1 + "</p>" +
              "<table><tbody>" +
              "<tr><td>No data</td></tr>" +
              "</tbody></table>"
            )
              .style("left", (d3.event.pageX + 15) + "px")
              .style("top", (d3.event.pageY - 28) + "px")

        }
        d3.select(this).attr("opacity", "0.6")
      })
      .on("mouseout", function (d) {
        tooltip.transition()
          .duration(250)
          .style("opacity", 0)

        d3.select(this).attr("opacity", "1")
      })
    drawLegend(svg, width)
    svg.call(zoom)
  }
}

function redraw() {
  const width = window.innerWidth
  const height = window.innerHeight
  draw(width, height)
}

window.addEventListener("resize", redraw)

document.getElementById("hide-link").addEventListener("click", function (event) {
  event.preventDefault();
  document.getElementById("hide").style.display = "none";
  document.getElementById("show").style.display = "block";
  document.getElementById("header-content").style.display = "none";
}, false);


document.getElementById("show-link").addEventListener("click", function (event) {
  event.preventDefault();
  document.getElementById("show").style.display = "none";
  document.getElementById("hide").style.display = "block";
  document.getElementById("header-content").style.display = "block";
}, false);
