function initDash(){
    map = L.map('hdx-ipc-map',{});

    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    map.scrollWheelZoom.disable();

    info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'ipc-info');
        return this._div;
    };

    info.addTo(map);

    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            labels = ['0 - 19','20 - 39','40 - 59','60 - 79','80 - 99','100'];

        div.innerHTML = 'Percent (%) of<br />medical centers reached<br />';
        for (var i = 0; i < labels.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' + labels[5-i] +'<br />';
        }

        return div;
    };

legend.addTo(map);    

    addDataToGeom();
    addGeomToMap(adm1_geom);
}

function addDataToGeom(){
    cf = crossfilter(data);

    var adm1Dimension = cf.dimension(function(d){return d['#adm1+code']});
    var adm2Dimension = cf.dimension(function(d){return d['#adm2+code']});
    var adm3Dimension = cf.dimension(function(d){return d['#adm3+code']});
    var outputDimension = cf.dimension(function(d){return d['#output+type'];});

    var adm1ReachedGroup = adm1Dimension.group().reduceSum(function(d){return d['#reached']});
    var adm2ReachedGroup = adm2Dimension.group().reduceSum(function(d){return d['#reached']});
    var adm3ReachedGroup = adm3Dimension.group().reduceSum(function(d){return d['#reached']});

    var adm1InneedGroup = adm1Dimension.group().reduceSum(function(d){return d['#inneed']});
    var adm2InneedGroup = adm2Dimension.group().reduceSum(function(d){return d['#inneed']});
    var adm3InneedGroup = adm3Dimension.group().reduceSum(function(d){return d['#inneed']});    

    var outputs = ['PCI Ebola','Triage','WASH'];

    outputs.forEach(function(e){
        outputDimension.filter(e)
        var reached = adm1ReachedGroup.top(Infinity);
        var inneed = adm1InneedGroup.top(Infinity);        
        adm1_geom.features.forEach(function(f){
            reached.forEach(function(d){
                if(d.key == f.properties.CODE){
                    f.properties[e+'_reached'] = d.value;
                }
            });
            inneed.forEach(function(d){
                if(d.key == f.properties.CODE){
                    f.properties[e+'_inneed'] = d.value;
                }
            });            
        });
        var reached = adm2ReachedGroup.top(Infinity);
        var inneed = adm2InneedGroup.top(Infinity);        
        adm2_geom.features.forEach(function(f){
            reached.forEach(function(d){
                if(d.key == f.properties.CODE){
                    f.properties[e+'_reached'] = d.value;
                }
            });
            inneed.forEach(function(d){
                if(d.key == f.properties.CODE){
                    f.properties[e+'_inneed'] = d.value;
                }
            });            
        });
        var reached = adm3ReachedGroup.top(Infinity);
        var inneed = adm3InneedGroup.top(Infinity);        
        adm3_geom.features.forEach(function(f){
            reached.forEach(function(d){
                if(d.key == f.properties.CODE){
                    f.properties[e+'_reached'] = d.value;
                }
            });
            inneed.forEach(function(d){
                if(d.key == f.properties.CODE){
                    f.properties[e+'_inneed'] = d.value;
                }
            });            
        });                         
    });
}

function addGeomToMap(geom){
    if(admlevel==1){
        overlay1 = L.geoJson(geom,{
            style:styleGeom,
            onEachFeature: onEachFeatureADM1
        });
        overlay1.addTo(map);
    }
    if(admlevel==2){
        overlay2 = L.geoJson(geom,{
            style:styleGeom,
            onEachFeature: onEachFeatureADM2
        });
        overlay2.addTo(map);
    }
    if(admlevel==3){
        overlay3 = L.geoJson(geom,{
            style:styleGeom,
            onEachFeature: onEachFeatureADM3
        });
        overlay3.addTo(map);
    }

    zoomToGeom(geom);
}

function styleGeom(feature){

    var color = 5-Math.floor(feature.properties[output+'_reached']/feature.properties[output+'_inneed']*5);
    console.log(color);
    if(isNaN(color)){console.log('check');color=0;}
    return {
            fillColor: colors[color],
            color: 'black',
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
            class:'adm'
        }
}

function onEachFeatureADM1(feature,layer){
    layer.on('click',function(e){
            overlay1.setStyle({
                fillColor: "#999999",
                color: "black",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.2
            });          
            map.removeLayer(overlay2);
            map.removeLayer(overlay3);
            var newGeom = filterGeom(adm2_geom,e.target.feature.properties.CODE,6);
            admlevel=2;
            addGeomToMap(newGeom);         
    });
    layer.on('mouseover',function(){
        $('.ipc-info').html('<p>'+feature.properties.NAME+'</p><p>Reached:'+feature.properties[output+'_reached']+'</p><p>Total:'+feature.properties[output+'_inneed']+'</p>');
    });
    layer.on('mouseout',function(){
        $('.ipc-info').html('Hover for details');
    });
}

function onEachFeatureADM2(feature,layer){
    layer.on('click',function(e){          
            map.removeLayer(overlay2);
            var newGeom = filterGeom(adm3_geom,e.target.feature.properties.CODE,9);
            admlevel=3;
            addGeomToMap(newGeom);         
    });
    layer.on('mouseover',function(){
        $('.ipc-info').html('<p>'+feature.properties.NAME+'</p><p>Reached:'+feature.properties[output+'_reached']+'</p><p>Total:'+feature.properties[output+'_inneed']+'</p>');
    });    
    layer.on('mouseout',function(){
        $('.ipc-info').html('Hover for details');
    });
}

function onEachFeatureADM3(feature,layer){
    layer.on('mouseover',function(){
        $('.ipc-info').html('<p>'+feature.properties.NAME+'</p><p>Reached:'+feature.properties[output+'_reached']+'</p><p>Total:'+feature.properties[output+'_inneed']+'</p>');
    });    
    layer.on('mouseout',function(){
        $('.ipc-info').html('Hover for details');
    });
}

function filterGeom(geom,filter,length){
    var newFeatures = [];
    var newgeom = jQuery.extend({}, geom);
    newgeom.features.forEach(function(f){
        if(f.properties.CODE.substring(0,length)==filter){
            newFeatures.push(f);
        }    
    });
    newgeom.features = newFeatures;
    return newgeom;
}

function zoomToGeom(geom){
    var bounds = d3.geo.bounds(geom);
    map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
}

function hxlProxyToJSON(input){
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            keys = e;
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

$('.dash').hide();

var map;
var info;
var admlevel=1;
var output = 'PCI Ebola';
var overlay1 = '';
var overlay2 = '';
var overlay3 = '';
var data;
var colors = ['#4575b4','#91bfdb','#e0f3f8','#fee090','#fc8d59','#d73027'];

var adm1_geom = topojson.feature(gui_adm1,gui_adm1.objects.gui_adm1);
var adm2_geom = topojson.feature(gui_adm2,gui_adm2.objects.gui_adm2);
var adm3_geom = topojson.feature(gui_adm3,gui_adm3.objects.gui_adm3);

var data1url = 'https://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//www.dropbox.com/s/ko1bxl8z69ptxny/ipc-facility-coverage-adm3.csv%3Fdl%3D1+&strip-headers=on&format=html&filter01=&filter02=&filter03=&filter04=&filter05=&filter06=&filter07=&force=1';

var data1Call = $.ajax({ 
    type: 'GET', 
    url: data1url, 
    dataType: 'json',
    success:function(dataIn){
        data = hxlProxyToJSON(dataIn);

        $('.loading').hide();
        $('.dash').show();

        initDash();

        $('#reinit').click(function(e){
            map.removeLayer(overlay2);
            map.removeLayer(overlay3);
            admlevel =1;
            addGeomToMap(adm1_geom);
        });

        $('#pci').on('click',function(){
            output = 'PCI Ebola';
            if(admlevel==1){overlay1.setStyle(styleGeom)};
            if(admlevel==2){overlay2.setStyle(styleGeom)};
            if(admlevel==3){overlay3.setStyle(styleGeom)};
            $('.tab').removeClass('ipc-active');
            $('.tab').addClass('ipc-inactive');
            $('#pci').removeClass('ipc-inactive');
            $('#pci').addClass('ipc-active');                 
        })    

        $('#triage').on('click',function(){
            output = 'Triage';
            if(admlevel==1){overlay1.setStyle(styleGeom)};
            if(admlevel==2){overlay2.setStyle(styleGeom)};
            if(admlevel==3){overlay3.setStyle(styleGeom)};            
            $('.tab').addClass('ipc-inactive');
            $('.tab').removeClass('ipc-active');
            $('#triage').removeClass('ipc-inactive');
            $('#triage').addClass('ipc-active');                 
        })

        $('#wash').on('click',function(){
            output = 'WASH';
            if(admlevel==1){overlay1.setStyle(styleGeom)};
            if(admlevel==2){overlay2.setStyle(styleGeom)};
            if(admlevel==3){overlay3.setStyle(styleGeom)};            
            $('.tab').removeClass('ipc-active');
            $('.tab').addClass('ipc-inactive');
            $('#wash').removeClass('ipc-inactive');
            $('#wash').addClass('ipc-active');                 
        })            
    },
    error:function(e,exception){
        console.log(exception);
    }
});
