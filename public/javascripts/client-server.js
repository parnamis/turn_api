/**
 * Starts the client and server pushing functionality
 */
var startClientServer = function() {

    //Get the URL to hand into the connect call
    var http = location.protocol;
    var slashes = http.concat("//");
    var host = slashes.concat(window.location.hostname);

    //Socket IO communications
    var socket = io.connect(host);

    var turn_server_data=null;

    var minBufferSize = 2;
    var maxBufferSize = 9;
    var clientInterval = null;
    var rebuffer = true;
    var serverUpdates = 1;
    var clientUpdates = 0;
    
    /**
     * Repaint graph function.  This repaints the graph
     * at a timed interval
     */
    function repaintGraph() {
          var data,data1,options,chart;
          data1 = [];
          data=[];


          if(turn_server_data!=null){
              for(var k=0;k<turn_server_data.length;k++){
                     // console.log('retreived '+ turn_server_data[k].turn_server_ip);
                      data1 = [];
                      for(var i = 1; i < 10; i++) { 

                          if(document.getElementById('CPU').checked) {
                            data1.push([i,turn_server_data[k].cpu_percentage])
                          }else if(document.getElementById('Memory').checked){
                            data1.push([i,turn_server_data[k].mem_usage])
                           }else{
		            data1.push([i,turn_server_data[k].active_connections])
			   }

                      }
                      data.push({ data:data1, label:turn_server_data[k].turn_server_ip, lines:{show:true}});
             }
         }
         

          options = {legend:{position:"nw"}};

          $(document).ready(function(){
  	        chart = $.plot($("#placeholder"),data,options);
          });
           
    }

    /*
     * Receiving data from the server
     */
    socket.on('dataSet', function (data) {
       // console.log('received '+ data[0].turn_server_ip);
        turn_server_data=data;
    });


    //Client side, wake up an _independent_ amount of time
    //from the server and try to repaint.  This gives us a smooth
    //animation and nothing jerky.  You really don't want to put
    //it within the socket call.  Let that "buffer" the data
    //instead.
    clientInterval = setInterval(function () {
        clientUpdates = 10000;
        repaintGraph();
    },clientUpdates);

};
