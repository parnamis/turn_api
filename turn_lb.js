var config = require('./config/conftool').getConf();
var cql = require('node-cassandra-cql');
var client = new cql.Client(config.cassandra_config);
var num_servers_to_return = config.max_server_count;

var best_server_ip = '96.119.0.000';
var invalidate_server_maxInterval = 60;
var server_array = null;

exports.getServer_array = function () {
  return server_array;
};

var intervalTime = 5000;

setInterval(function () {
  client.execute('select * from turn_lb',
    function (err, result) {
    if (err) {
      console.log('TURN API ERROR [event=%s, message=%s, errorString=%s ]', 'Query Cassandra', 'Cassandra query error', JSON.stringify(err));
    } else {

      server_array = result.rows;

      console.log('TURN API INFO [ event=%s, message=%s, serverCount=%s ]', 'Query Cassandra', 'Successfully queried Cassandra', JSON.stringify(result.rows));

      for (var i = 0; i < result.rows.length; i++) {

        if (!((Math.round(new Date() / 1000) - result.rows[i].timestamp) < invalidate_server_maxInterval)) {
          //console.log(result.rows[i].turn_server_ip+" is a Valid Server");
          //console.log("results "+result.rows[i].cpu_percentage,  result.rows[i].turn_server_ip,result.rows[i].active_connections);

          //console.log("\n Not getting Reports from " + result.rows[i].turn_server_ip);

          var ts = new Date(result.rows[i].timestamp*1000).toISOString();
          var ip = JSON.stringify(result.rows[i].turn_server_ip);

          result.rows[i].invalid = true;

          console.log('TURN API ERROR [ event=%s, message=%s, server=%s, lastActive=%s ]', 'Cassandra data processing', 'No response from TURN server - removing from available server list', ip, ts);

        }

      }

      server_array = [];
      for(var i=0; i<result.rows.length; ++i) {
        if(!result.rows[i].invalid) {
          server_array.push(result.rows[i]);
        }
      }

      // Sort server array by number of connections
      sortServerArray(server_array);

      // Trim results to show only N best servers
      server_array.splice(num_servers_to_return, server_array.length);

    }
  });
}, intervalTime);


function sortServerArray(result) {
  result.sort(compare);
}

function compare(a, b) {
  if (a.active_connections < b.active_connections) {
    return -1;
  } else if (a.active_connections > b.active_connections) {
    return 1;
  } else {
    return 1;
  }
}