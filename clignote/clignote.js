var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://bd978efd:5290e98ac79955d1@broker.shiftr.io');
const express = require('express');
const app = express()

var http = require('http').Server(app);
var fs = require('fs');
var light = true;


// Chargement de socket.io
var io = require('socket.io').listen(http);


http.listen(3000);

createDataBase();

createCollection();

app.get('/', (req, res) => {
	res.send(render());
});

app.get('/on', (req, res) => {
	light = true;
	client.publish('LED', 'on')
	res.send(render())
	console.log('TURN ON');
});

app.get('/off', (req, res) => {
	light = false;
	client.publish('LED', 'off')
	res.send(render())
	console.log('TURN OFF');
});

app.get('/temperature', (req, res) => {
	temperature(res);
	console.log('Affichage temperature');
	// Ton code ici
});


client.subscribe('Temperature');

client.on('connect', () => {
  client.publish('hello', 'Node connected')
  console.log('Connected')
})

 
client.on('message', (topic, message) => {
  	console.log('Topic : ' + topic + ' Message : ' + message)
	io.sockets.emit('msgTemp', message.toString());
	addValue(message.toString());
})



function render(){
	//return '<a href="/on"><button id="allume">ON</button></a><a href="/off"><button id="eteind">OFF</button></a><p id = "temperature">Temperature : </p>'
return `<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<title>Arduino</title>
	<link rel="stylesheet" type="text/css" href="css/style.css">
</head>
<body>
	<div class="btn">
		<a href="/on"><button id="allume">ON</button></a>
		<a href="/off"><button id="eteind">OFF</button></a>
		<a href="/temperature"><button id="temp">Temperature</button></a>
	</div>
	<p id="temperature">Temperature : </p>
</body>
	<script src="/socket.io/socket.io.js"></script>
    <script>
        var socket = io.connect('http://localhost:3000');
        socket.on('msgTemp', (message) => {
        	document.getElementById('temperature').innerHTML = message;
        })
    </script>
</html>`
}

function temperature(res){
getValues(function(result){
	temperature = JSON.stringify(result);
	//temperature = JSON.stringify(pretemperature);
	res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<title>Arduino</title>
	<script src="http://d3js.org/d3.v3.min.js"></script>
</head>
<body>
	<div id="tableauTemp" style="overflow:scroll; height:400px; width=100%">
	</div>
	<div id="graph" style="overflow:scroll; height:400px; width=100%">
	</div>
	<script src="/socket.io/socket.io.js"></script>
	<script>
        var socket = io.connect('http://localhost:3000');
        var ligne = "vide";
        var largeur= 500;
				var hauteur=200;

				var widthScale= d3.scale.linear()
					.domain([0, 60])
					.range([0,largeur]);

				var colorScale=d3.scale.linear()
					.domain([0, 54])
					.range(["white", "#3399FF"]);

				var axis=d3.svg.axis()
					.ticks(5)
					.scale(widthScale);
					
				var canvas=d3.select("#graph")
					.append("svg")
					.attr("width",largeur).attr("height",hauteur)
					.append("g")
					.attr("transform", "translate(20,0)");
        socket.on('msgTemp', (message) => {
			${temperature}.forEach(function(element){
				ligne = "<p>" + element['value'] + " Heure : " + element['hour'] +"</p>";
				var div = document.getElementById("tableauTemp");
				div.innerHTML += ligne;
			})
			var graphTemp = [];
			${temperature}.forEach(function(element){
				graphTemp.unshift(element['value']);
			})
				var donnees = graphTemp;
				

				var bars=canvas.selectAll("rect")
					.data(donnees)
					.enter()
						.append("rect")
							.attr("width", function(i){return widthScale(i);})
							.attr("height", 10)
							.attr("y", function(i,j){return j*10;})
							.attr("fill", function (i) {return colorScale (i);});
							
				canvas.append("g")
							.attr("transform", "translate(0,150)")
				  	   		.call(axis);
        })
    </script>
	</body>
	<script src="/socket.io/socket.io.js"></script>
</html>`)
}) 
}

function createDataBase(){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/mydb";

	MongoClient.connect(url, function(err, db) {
  	if (err) throw err;
  	console.log("Database created!");
  	db.close();
	});
}

function createCollection(){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";

	MongoClient.connect(url, function(err, db) {
  	if (err) throw err;
  	var dbo = db.db("mydb");
  	dbo.createCollection("temperature", function(err, res) {
	    if (err) throw err;
    	console.log("Collection created!");
    	db.close();
  		});
	});
}

function addValue(temp){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";
	var date = new Date();
	var current_hour = date.getHours() + 'h' + date.getMinutes();

	MongoClient.connect(url, function(err, db) {
  	if (err) throw err;
  	var dbo = db.db("mydb");
  	var myobj = { name: "Température", value: temp, hour: current_hour};
  	dbo.collection("temperature").insertOne(myobj, function(err, res) {
    	if (err) throw err;
    	console.log("1 document inserted");
   		db.close();
  		});
	});
}

function getValues(callback){
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://localhost:27017/";

	MongoClient.connect(url, function(err, db) {
  	if (err) throw err;
  	var dbo = db.db("mydb");
  	var tableau = dbo.collection("temperature").find({}).toArray(function(err, result) {
    	if (err) throw err;
    	//console.log(result);
    	callback(result);
    	db.close();
  		});
	return tableau;
	});
}