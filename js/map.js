$(function(){
	var styleCache = {};

	var raster = new ol.layer.Tile({
		source: new ol.source.MapQuest({layer: 'sat'})
	});
	var bing = new ol.layer.Tile({
      source: new ol.source.BingMaps({
      	// todo: fix own key for server
      	key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
        imagerySet: 'Aerial'
        //imagerySet: 'AerialWithLabels'
      })
    })
	// existing features expected to be contained in cykelplan_features variable
	// todo: load async on server	
	source = new ol.source.GeoJSON((cykelplan_features));	

	var layer = new ol.layer.Vector({
	  	source: source,
	  	style: function(feature, resolution) {
	  		
	    var text = ''+feature.get('priority')+feature.get('status_code');
	    console.log(feature.get('id'), text);
	    if (!styleCache[text]) {	    	
	    	var width = 1.5+3-feature.get('priority');
	    	var color = '#3399CC';
	    	if (feature.get('priority')==1) {
	    		switch (feature.get('status_code')){
	    			case -1:
	    				color = '#c44';
	    				break;
	    			case 0:
	    				color = '#fa3';
	    				break;
	    			case 1:
	    				color = '#3c9';
	    				break;
	    		}	    			
	    	}
	      	styleCache[text] = [	      		
      			new ol.style.Style({
        			stroke: new ol.style.Stroke({
          				color: "white",
          				width: width*1.2
        			})	        
      			}),
      			new ol.style.Style({
        			stroke: new ol.style.Stroke({
          				color: color,
          				width: width
        			})	        
      			})      			
	      	];
	    }
	    return styleCache[text];
	  }	  	
	});

	var map = new ol.Map({
	  	layers: [bing, layer],
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
			ev.feature.setProperties({'id': prompt("Ange ID")})
	  		source.addFeature(ev.feature);
	  		setTimeout(function(){
	  			map.removeInteraction(draw);
	  		}, 200);	
	  	});
	}

	$(".initDrawInteraction").click(function(event){
		addDrawInteraction($(event.target).data("geomtype"))		
	});	

	var json_textarea = $("#json_string")
	var update_json_textarea = function(){
		var geojson = (new ol.format.GeoJSON()).writeFeatures(source.getFeatures());
		geojson.features.sort(function(a,b){	
			af = parseFloat(a.properties.id)
			bf = parseFloat(b.properties.id)		
			if(af==bf)
				return a>b ? -1 : (a<b ? 1 : 0)					
			return af - bf
		});
		feature_data_as_string = JSON.stringify({"object":geojson}, null, 1);
		feature_data_as_string = feature_data_as_string.replace(/\[\s*([0-9\.]+),\s*([0-9\.]+)\s*\]/g, "[$1, $2]")
		json_textarea.val("var cykelplan_features = " + feature_data_as_string);
	};
	source.on('change', update_json_textarea);
	update_json_textarea();



	var element = document.getElementById('popup');

	var popup = new ol.Overlay({
	  element: element,
	  positioning: 'bottom-center',
	  stopEvent: false
	});
	map.addOverlay(popup);

	// display popup on click
	/*map.on('singleclick', function(evt) {
		var element = document.getElementById('popup');
	  	var feature = map.forEachFeatureAtPixel(evt.pixel,
	      	function(feature, layer) {
	        	return feature;
	    	}
	    );
	  	if (feature) {
		    var geometry = feature.getGeometry();	    
		    var properties = feature.getProperties();
		    $(element).find('table').html("")	    
		    for(key in properties){
		    	$(element).find('table').append('<tr><td>'+key+'</td><td>'+properties[key]+"</td></tr>");
		    }		    
		    popup.setPosition(geometry.getCoordinates()[0]);
	  	} else {
	  		popup.setPosition();	    	
	  	}
	});*/
});