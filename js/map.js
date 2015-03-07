$(function(){
	var raster = new ol.layer.Tile({
		source: new ol.source.MapQuest({layer: 'sat'})
	});

	source = new ol.source.GeoJSON(({
      	object: {
		    "type": "FeatureCollection",
		    "features": [
		        {
		            "type": "Feature",
		            "geometry": {
		                "type": "LineString",
		                "coordinates": [
		                    [
		                        1792356.0411564154,
		                        8020879.688571336
		                    ],
		                    [
		                        2090766.1995817432,
		                        8368209.5450991765
		                    ],
		                    [
		                        1640704.9770386256,
		                        8373101.514909428
		                    ]
		                ]
		            }
		        }
		    ]
		}
	}));

	var layer = new ol.layer.Vector({
	  	source: source	  	
	});

	var map = new ol.Map({
	  	layers: [raster, layer],
	  	target: 'map'	  	
	});

	map.getView().fitExtent(source.getExtent(), map.getSize());	

	var select = new ol.interaction.Select();
	map.addInteraction(select);
	
	var modify = new ol.interaction.Modify({
	  	features: select.getFeatures(),	  
	  	deleteCondition: function(event) {
	    	return ol.events.condition.shiftKeyOnly(event) &&
	        	ol.events.condition.singleClick(event);
	  	}
	});
	map.addInteraction(modify);

	var draw;
	function addDrawInteraction(geom_type) {	  
	  	draw = new ol.interaction.Draw({
	    	features: select.getFeatures(),
	    	type: geom_type
	  	});
	  	map.addInteraction(draw);
		draw.on('drawend', function(ev){
	  		source.addFeature(ev.feature);	  		  
	  		setTimeout(function(){
	  			map.removeInteraction(draw);
	  		}, 200);	
	  	});
	}

	$(".initDrawInteraction").click(function(event){
		addDrawInteraction($(event.target).data("geomtype"))		
	});	
});