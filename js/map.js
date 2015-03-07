$(function(){
	var raster = new ol.layer.Tile({
		source: new ol.source.MapQuest({layer: 'sat'})
	});
	var bing = new ol.layer.Tile({
      source: new ol.source.BingMaps({
      	// todo: fix own key for server
      	key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
        imagerySet: 'Aerial'
      })
    })
	// existing features expected to be contained in cykelplan_features variable
	// todo: load async on server	
	source = new ol.source.GeoJSON((cykelplan_features));	

	var layer = new ol.layer.Vector({
	  	source: source	  	
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
		json_textarea.val("var cykelplan_features = " + JSON.stringify({"object":geojson}, null, 4));
	};
	source.on('change', update_json_textarea);
	update_json_textarea();
});