(function () {
    var Benchmark = require('benchmark');
    var FlareWebmDemuxer = require('flare-webm-demuxer');
    var Chart = require('chart.js');
    var demuxer;
    var start;
    var delta;
    var timeStamps = [];
    var audioTimeStamps = [];
    var videoTimeStamps = [];
    var videoSizeTime = [];
    var audioSizeTime = [];
    var returnValue = false;
    var initTime;
    var videoDemuxCount = 0;
    var audioDemuxCount = 0;


    var getTimestamp;
    if (typeof performance === 'undefined' || typeof performance.now === 'undefined') {
        getTimestamp = Date.now;
    } else {
        getTimestamp = performance.now.bind(performance);
    }

    var request = new XMLHttpRequest();
    request.open("GET", "Curiosity's_Seven_Minutes_of_Terror.ogv.160p.webm", true);
    request.responseType = "arraybuffer";

    request.onload = function (event) {
        processLoop(request.response);
        //processLoop2(request.response);
        //var date = Date.now();

        //exportData(timeStamps.join('\n') , date + 'export.csv', 'text/csv');
        //draw chart

        //console.log(timeStamps);
        loadChart();

    };

    request.send(null);

    function processLoop(buffer) {
        //console.log(buffer);

        var data = new DataView(buffer);
        demuxer = new FlareWebmDemuxer();
        //demuxer2 = new OGVDemuxerWebM();

        var length = buffer.byteLength;

        demuxer.receiveInput(buffer, callback);


        //The first returned true should mean meta is loaded
        while (!returnValue) {
            initDemuxer();
        }

        //now keep going until we run out of data
        do {
            process();
            //if(!returnValue)

        } while (!demuxer.eof);

        //console.log(demuxer);
        //console.log(timeStamps);
    }



    function callback(ret) {
        returnValue = ret;
    }

    function initDemuxer() {
        start = getTimestamp();
        demuxer.process(callback);
        delta = getTimestamp() - start;
        initTime = delta;
        return returnValue;
    }

    function process() {
        start = getTimestamp();
        demuxer.process(callback);
        delta = getTimestamp() - start;

        if (demuxer.audioPackets.length > audioTimeStamps.length) {
            var pointNum = audioTimeStamps.length;
            audioTimeStamps.push([pointNum, delta]);
            var packetSize = demuxer.audioPackets[demuxer.audioPackets.length -1].data.byteLength;
            audioSizeTime.push([packetSize ,delta]);
        } else if (demuxer.videoPackets.length > videoTimeStamps.length) {
            var pointNum = videoTimeStamps.length;
            var packetSize = demuxer.audioPackets[demuxer.audioPackets.length -1].data.byteLength;
            videoTimeStamps.push([pointNum, delta]);
            videoSizeTime.push([packetSize ,delta]);
        }else{
            console.warn("no additional ");
        }

        //var pointNum = timeStamps.length;
        //timeStamps.push([pointNum, delta]);
        return returnValue;
    }

    var data = [['name1', 'city1', 'some other info'], ['name2', 'city2', 'more info']];
    var csvContent = '';
    data.forEach(function (infoArray, index) {
        dataString = infoArray.join(';');
        csvContent += index < data.length ? dataString + '\n' : dataString;
    });
    var testData = [0, 1, 2, 8].join('\n');

    var exportData = function (content, fileName, mimeType) {
        var a = document.createElement('a');
        mimeType = mimeType || 'application/octet-stream';

        if (navigator.msSaveBlob) {
            return navigator.msSaveBlob(new Blob([content], {type: mimeType}), fileName);
        } else if ('download' in a) {
            a.href = 'data:' + mimeType + ',' + encodeURIComponent(content);
            a.setAttribute('download', fileName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return true;
        } else { //do iframe dataURL download (old ch+FF):
            var f = document.createElement('iframe');
            document.body.appendChild(f);
            f.src = 'data:' + mimeType + ',' + encodeURIComponent(content);

            setTimeout(function () {
                document.body.removeChild(f);
            }, 333);
            return true;
        }
    };


    function loadChart() {
        // Load the Visualization API and the corechart package.
        google.charts.load('current', {'packages': ['corechart']});

        // Set a callback to run when the Google Visualization API is loaded.
        google.charts.setOnLoadCallback(drawChart);

        // Callback that creates and populates a data table,
        // instantiates the pie chart, passes in the data and
        // draws it.
        function drawChart() {
            var chartHeight = 400;
            // Create the data table.
            var audioData = new google.visualization.DataTable();
            audioData.addColumn('number', 'Demux Cycle');
            audioData.addColumn('number', 'Time');
            audioData.addRows(audioTimeStamps);

            var videoData = new google.visualization.DataTable();
            videoData.addColumn('number', 'Demux Cycle');
            videoData.addColumn('number', 'Time');
            videoData.addRows(videoTimeStamps);
            
            var audioSizeData = new google.visualization.DataTable();
            audioSizeData.addColumn('number', 'Demux Cycle');
            audioSizeData.addColumn('number', 'Time');
            audioSizeData.addRows(audioSizeTime);

            var videoSizeData = new google.visualization.DataTable();
            videoSizeData.addColumn('number', 'Demux Cycle');
            videoSizeData.addColumn('number', 'Time');
            videoSizeData.addRows(videoSizeTime);

            // Set chart options
            var audioOptions = {'title': 'Audio demux cycle times',
                'width': '100%',
                'height': chartHeight,
                'explorer': {
                    axis: 'horizontal',
                    keepInBounds: true 
                },
                //chartArea: {width: '100%', height: '100%'},
                crosshair: {focused: {color: '#3bc', opacity: 0.8}}
            };

            var videoOptions = {'title': 'Video demux cycle times',
                'width': '100%',
                'height': chartHeight,
                'explorer': {
                    axis: 'horizontal',
                    keepInBounds: true 
                },
                //chartArea: {width: '100%', height: '100%'},
                crosshair: {focused: {color: '#3bc', opacity: 0.8}}
            };
            
            var audioSizeOptions = {'title': 'Audio Packet Size Vs Time',
                'width': '100%',
                'height': chartHeight,
                'explorer': {
                    axis: 'horizontal',
                    keepInBounds: true
                },
                trendlines: {
                    0: {
                        type: 'linear',
                        color: 'green',
                        lineWidth: 3,
                        opacity: 0.3,
                        showR2: true,
                        visibleInLegend: true
                    }
                },
                //chartArea: {width: '100%', height: '100%'},
                crosshair: {focused: {color: '#3bc', opacity: 0.8}}
            };

            var videoSizeOptions = {'title': 'Video Packet Size Vs Time',
                'width': '100%',
                'height': chartHeight,
                'explorer': {
                    axis: 'horizontal',
                    keepInBounds: true 
                },
                trendlines: {
                    0: {
                        type: 'linear',
                        color: 'green',
                        lineWidth: 3,
                        opacity: 0.3,
                        showR2: true,
                        visibleInLegend: true
                    }
                },
                //chartArea: {width: '100%', height: '100%'},
                crosshair: {focused: {color: '#3bc', opacity: 0.8}}
            };

            // Instantiate and draw our chart, passing in some options.
            var audioChart = new google.visualization.ScatterChart(document.getElementById('audio_chart_div'));
            audioChart.draw(audioData, audioOptions);

            // Instantiate and draw our chart, passing in some options.
            var videoChart = new google.visualization.ScatterChart(document.getElementById('video_chart_div'));
            videoChart.draw(videoData, videoOptions);
            
            // Instantiate and draw our chart, passing in some options.
            var audioSizeChart = new google.visualization.ScatterChart(document.getElementById('audio_size_chart_div'));
            audioSizeChart.draw(audioSizeData, audioSizeOptions);

            // Instantiate and draw our chart, passing in some options.
            var videoSizeChart = new google.visualization.ScatterChart(document.getElementById('video_size_chart_div'));
            videoSizeChart.draw(videoSizeData, videoSizeOptions);

           window.onresize = function(){
                drawChart();
            };
        }
    }


})();
