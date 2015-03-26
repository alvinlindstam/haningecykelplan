$(function(){
	var edit = window.location.hash=="#edit"

	var styleCache = {};
	var getStyle = function(outline_width){
		if (typeof(outline_width)!="number")
			outline_width = 1.2
		return function(feature, resolution) {
	  		
		    var text = ''+feature.get('priority')+feature.get('status_code')+outline_width;	    
		    if (!styleCache[text]) {	    	
		    	var width = 6-feature.get('priority');
		    	var color = '#3399CC';
		    	if (feature.get('priority')==1) {
		    		switch (feature.get('status_code')){
		    			case -1:
		    				color = '#c44';
		    				break;
		    			case 0:
		    				color = '#fa3';
		    				break;	    			
		    		}	    			
		    	}
		    	if(feature.get('status_code')==1)
		    		color = '#3c9';

		      	styleCache[text] = [	      		
	      			new ol.style.Style({
	        			stroke: new ol.style.Stroke({
	          				color: "white",
	          				width: width*outline_width
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
	}

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
	  	style: getStyle(),	  	
	});

	map = new ol.Map({
	  	layers: [bing, layer],
	  	target: 'map'	  	
	});

	map.getView().fitExtent(source.getExtent(), map.getSize());	

	var select = new ol.interaction.Select({
		style: getStyle(2)
	});
	map.addInteraction(select);
	
	if(edit)
	{	
		$('.edit').show();
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
			var geojson = JSON.parse((new ol.format.GeoJSON()).writeFeatures(source.getFeatures()));
			geojson.features.sort(function(a,b){	
				var a_id = a.properties.id
				var b_id = b.properties.id
				var diff = parseFloat(a_id) - parseFloat(b_id)			
				if(diff==0)				
					return a_id>b_id ? 1 : (a_id<b_id ? -1 : 0)					
				return diff
			});
			feature_data_as_string = JSON.stringify({"object":geojson}, null, 1);
			feature_data_as_string = feature_data_as_string.replace(/\[\s*([0-9\.]+),\s*([0-9\.]+)\s*\]/g, "[$1, $2]")
			json_textarea.val("var cykelplan_features = " + feature_data_as_string);
		};
		source.on('change', update_json_textarea);
		update_json_textarea();
	}
	




	var display_keys = {		
	    "path_description": "Sträcka",	    
	    "planned_work": "Planerad åtgärd",
	    "neigborhood": "Område",
	    "priority": "Prioritet",
	    "id": "ID (nummer i cykelplanen)",
	    "length": "Planerad längd (m)",
	    "cost": "Beräknad kostnad (kr)",
	    "cost_per_meter": "Beräknad kostnad per meter (kr)",
	    "path_etapp": "Delsträcka som denna linje avser",
	    "comment": "Kommentar i cykelplanen",	    
	    "status_code": "Status",
	    "own_comment": "Min kommentar",	    
	}
	var display_transformers = {
		"status_code": function(properties){
			var val = properties.status_code;
			if (val<0)
				return "Ej genomförd"
			if (val==0)
				return ""
			if (val>0)
				return "Genomförd"
		},
		"priority": function(properties){
			var texts = ['', "1 - Genomförs 2011-2015", "2 - Genomförs 2016-2020", "3 - Genomförs 2021-2030"];
			return texts[properties.priority]
		},
		"cost_per_meter": function(properties){
			return Math.round(properties.cost/properties['length']);		
		},
		"own_comment": function(properties){
			if (properties.own_comment)
				return properties.own_comment.replace(/\n/g, "<br/><br/>");
		}
	}
	// First, checks if it isn't implemented yet.
	if (!String.prototype.format) {
	  String.prototype.format = function() {
	    var args = arguments;
	    return this.replace(/{(\d+)}/g, function(match, number) { 
	      return typeof args[number] != 'undefined'
	        ? args[number]
	        : match
	      ;
	    });
	  };
	}
	select.on('select', function(e){
		var features = e.target.getFeatures().getArray();
		$('footer, #right').html("");
		var html ='';		
		if (window.innerHeight>window.innerWidth){
			var node = $('footer')
			var f_string = "<tr><td class=\"title\">{0}</td><td class=\"value\">{1}</td></tr>"
			var outer_string ="<table \"metadata\">{0}</table>";
		}else{
			var node = $('#right');		
			var f_string = "<h3>{0}</h3><p>{1}<p>"
			var outer_string ="{0}"
		}
		$.each(features, function(index, feature){
			var props = feature.getProperties();			
			$.each(display_keys, function(key, title){
				var value = props[key]
				if(display_transformers[key])
					value = display_transformers[key](props)
				if(value!=undefined&&value!="")					
					html += f_string.format(title, value);
			})
			//html += "";
		})
		
		node.html(outer_string.format(html));		
		$(window).resize();
	});
	
	$(window).on('resize', function(){
		var h = $('header').outerHeight()
		var f = $('footer').outerHeight();
		var ww = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
		var wh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
		$(".content, #map").height(wh-(h+f));		
		
		var rw = $('#right').outerWidth()+1
		rw = rw < 20 ? 0 : rw;
		$('#map').width(ww-rw)
		map.updateSize();
	}).resize()

	
});