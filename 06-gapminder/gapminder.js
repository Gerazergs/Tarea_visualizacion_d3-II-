// Clon de Gapminder
//
//


// selecciona el id graf clase vizprev
graf = d3.select('#graf')

//se calcula el ancho total
ancho_total = graf.style('width').slice(0, -2)
//se calcula el alto total
alto_total  = ancho_total * 0.5625

//definicion de margenes
margins = {
  top: 30,
  left: 75,
  right: 15,
  bottom: 40
}
//definiciones de ancho alto del grafico
ancho = ancho_total - margins.left - margins.right
alto  = alto_total - margins.top - margins.bottom

// Area total de visualización
svg = graf.append('svg')
          .style('width', `${ ancho_total }px`)
          .style('height', `${ alto_total }px`)

// Contenedor "interno" donde van a estar los gráficos
g = svg.append('g')
        .attr('transform', `translate(${ margins.left }, ${ margins.top })`)
        .attr('width', ancho + 'px')
        .attr('height', alto + 'px')

//tamaño de letra inicial para la escritura del dia
fontsize = alto * 0.15
yearDisplay = g.append('text')
                .attr('x', ancho / 2)
                .attr('y', alto / 2 + fontsize/4)
                .attr('text-anchor', 'middle')
                .attr('font-family', 'Roboto')
                .attr('font-size', `${fontsize}px`)
                .attr('fill', '#587F9C')
                .text('28/02/2020')
                ; //año con el que empieza
              

//creamos un rectangulo    
g.append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', ancho)
  .attr('height', alto)
  .attr('stroke', 'black')
  .attr('fill', 'none')

g.append('clipPath')
  .attr('id', 'clip')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', ancho)
    .attr('height', alto)



// Escaladores
x = d3.scaleLog().range([0, ancho])
y = d3.scaleLinear().range([alto, 0])
r = d3.scaleLinear().range([10, 100])

// definimos colores
color = d3.scaleOrdinal().range(['#f94144', '#f8961e', '#90be6d', '#577590','#90be6F', '#577777'])

// Variables Globales
datos = []
years = []
iyear = 0
maxy  = 0
miny  = 5000
continente = 'todos'
corriendo  = true

//se crea la variable de intervalo
var interval

//configuracion de botones
contSelect = d3.select('#continente')
botonPausa = d3.select('#pausa')
slider     = d3.select('#slider');


//se leen los datos y se pasan a numerico
d3.csv('covid.csv').then((data) => {
  data.forEach((d) => {
    d.total_cases    = +d.total_cases
    d.total_deaths    = +d.total_deaths
    d.new_cases    = +d.new_cases
    d.date    = d.date
    //d.location = d.location

    // if (d.year > maxy) maxy = d.year
    // if (d.year < miny) miny = d.year
  })
  //escribimos en consola el minimo y y maximo de y
  console.log(`miny=${miny} maxy=${maxy}`)

  // se crea el arreglo de años 
  years = Array.from(new Set(d3.map(data, d => d.date)))
  // se filtran los datos si el numero de total de casos es mayor a 0 y muertes mayor a 0
  data = data.filter((d) => {
    return (d.total_cases > 0) && (d.total_deaths > 0)
  })
  

  datos = data
  // se agrega el atributo minimo y maximo al sliderv
  slider.attr('min', 0)
        .attr('max', years.length - 1)
  slider.node().value = 0

  // El dominio para el escalador ordinal
  color.domain(d3.map(data, d => d.continent))

  x.domain([d3.min(data, d => d.total_cases),
            d3.max(data, d => d.total_cases)])
  y.domain([d3.min(data, d => d.total_deaths),
            d3.max(data, d => d.total_deaths)])
  r.domain([d3.min(data, d => d.new_cases),
            d3.max(data, d => d.new_cases)])

  // Ejes
  xAxis = d3.axisBottom(x)
            .ticks(10)
            .tickFormat(d => d3.format(',d')(d))
  xAxisG = d3.axisBottom(x)
            .ticks(10)
            .tickFormat('')
            .tickSize(-alto)
            

  yAxis = d3.axisLeft(y)
            .ticks(10)
  yAxisG = d3.axisLeft(y)
            .ticks(10)
            .tickFormat('')
            .tickSize(-ancho)

  g.append('g')
    .call(xAxis)
    .attr('transform', `translate(0,${alto})`)
    
  g.append('g')
    .call(yAxis)

  g.append('g')
    .attr('class', 'ejes')
    .call(xAxisG)
    .attr('transform', `translate(0,${alto})`)
    
  g.append('g')
    .attr('class', 'ejes')
    .call(yAxisG)
    
  contSelect.append('option')
              .attr('value', 'todos')
              .text('Todos')
  color.domain().forEach(d => {
    contSelect.append('option')
                .attr('value', d)
                .text(d)
  })

  // Leyenda
  g.append('rect')
    .attr('x', ancho - 210)
    .attr('y', alto - 160)
    .attr('width', 200)
    .attr('height', 150)
    .attr('stroke', 'black')
    .attr('fill', '#dedede')

  //color por cada continente
  color.domain().forEach((d, i) => {
    g.append('rect')
      .attr('x', ancho - 200)
      .attr('y', alto - 150 + i*22)
      .attr('width', 20)
      .attr('height', 20)
      .attr('fill', color(d))
    //se agrega el texto del continente
    g.append('text')
      .attr('x', ancho - 175)
      .attr('y', alto - 135 + i*22)
      .attr('fill', 'black')
      .text(d[0].toUpperCase() + d.slice(1))
  })

  

  //se inicia la funcion frame
  frame()
  // se inicia el intervalo
  interval = d3.interval(() => delta(1), 50)
})

function frame() {
  // date es igual a la informacion de años 
  date = years[iyear]
  // se filtra  por date o fecha especifica
  data = d3.filter(datos, d => d.date == date)
  // se filtra por continente, inicia con todos
  data = d3.filter(data, d => {
    if (continente == 'todos')
      return true
    else
      return d.continent == continente
  })

  //el valor del slider es el indice de los años
  slider.node().value = iyear
  render(data)
}

function render(data) {
  yearDisplay.text(years[iyear])

  // se inician los circulos con la informacion de localizacion
  p = g.selectAll('circle')
        .data(data, d => d.location)
  

  // se hace visible la informacion del circulo
  p.enter()
    .append('circle')
      //radio inicial 0
      .attr('r', 0)
      // x es el total de casos
      .attr('cx', d => x(d.total_cases))
      // y es el total de muertes
      .attr('cy', d => y(d.total_deaths))
      // se rellena con este color
      .attr('fill', '#005500')
      .attr('clip-path', 'url(#clip)')
      .attr('stroke', '#333333')
      // tiene opacidad del 75%
      .attr('fill-opacity', 0.75)
    
      
    .merge(p)
      //hay un cambio de trancision de 300 milisegundos entre cada dato
      .transition().duration(50)
      .attr('cx', d => x(d.total_cases))
      .attr('cy', d => y(d.total_deaths))
      .attr('r', d => r(d.new_cases))
      .attr('fill', d => color(d.continent))
  
  //se termina con el radio de 0 y color #ff000
  p.exit()
    .transition().duration(50)
    .attr('r', 0)
    .attr('fill', '#ff0000')
    .remove()
}

// function atras() {
//   iyear--
//   if (iyear < 0) iyear = 0
//   frame()
// }

// function adelante() {
//   iyear++
//   if (iyear == years.lenght) iyear = years.lenght
//   frame()
// }

// Refactoring de las funciones de arriba
// DRY Don't Repeat Yourself

function delta(d) {
  iyear += d
  console.log(iyear)

  if (iyear < 0) iyear = years.length-1
  if (iyear > years.length-1) iyear = 0
  frame()
}

contSelect.on('change', () => {
  continente = contSelect.node().value
  frame()
})

botonPausa.on('click', () => {
  corriendo = !corriendo
  if (corriendo) {
    botonPausa
      .classed('btn-danger', true)
      .classed('btn-success', false)
      .html('<i class="fas fa-pause-circle"></i>')
      interval = d3.interval(() => delta(1), 50)
  } else {
    botonPausa
      .classed('btn-danger', false)
      .classed('btn-success', true)
      .html('<i class="fas fa-play-circle"></i>')
    interval.stop()
  }
})

slider.on('input', () => {
  // +d3.select('#sliderv').text(slider.node().value)
  iyear = +slider.node().value
  frame()
})

slider.on('mousedown', () => {
  if (corriendo) interval.stop()
})

slider.on('mouseup', () => {
  if (corriendo) interval = d3.interval(() => delta(1), 50)
})