### TURN API

Node.js app that polls a Cassandra database for the most recent utilization available about available TURN servers in the cluster and provides a web API for clients to query in order to get a list of available TURN servers sorted in order of least-utilized. 

### Prerequsites

git
node.js
forever
Cassandra

/opt/logs directory (writeable by the user account that will run the server process)


The installation instructions for these items is beyond the scope of this readme file.



### Installation and configuration 


```
cd /opt/
sudo git clone https://YOUR_GIT_USERNAME@github.com/CommsOps/turn_api.git
cd /opt/turn_api
sudo npm install
```


Configuration files for are stored in the  /config folder. Every logical data center location should have its own configuration file.  If necessary, create a new configuration file with an appropriate environment or data center suffix. (for example, wbrn, stg, qa2)


Sample configuration:

```
module.exports = { 

  cassandra_config : {
    hosts : ['YOUR_CASSANDRA_HOST_IP'],
    keyspace : 'turn_stats_db'
  },
  
  max_server_count: 1

}
```

Explanation:

hosts:  the IP address of the Cassandra host (in most cases, this is the localhost that's running the turn_api server)

keyspace:  the Cassandra keyspace (database) name

max_server_count:   number of TURN servers to return when a client requests available turn resources


### Execution

The init script is located in the scripts directory of this repository.  It will need to be modified to load the correct configuration file. 

The environment variable NODE_ENV needs to be set with an environment name that matches its corresponding config in config. For example, to load config_wbrn.js set NODE_ENV to "wbrn", to load config_qa2.js set NODE_ENV to "qa2".   


First, install the init script as follows:

```
sudo cp /opt/turn_api/script/turn_api /etc/init.d/turn_api
sudo chmod +x /etc/init.d/turn_api
sudo chkconfig --add turn_api
sudo chkconfig --level 35 turn_api on
```

Then, edit the /etc/init.d/turn_api script on line 17 to set the NODE_ENV variable to match your environment. 


To start the service:
```
sudo service turn_api start
```

To stop the service:
```
sudo service turn_api stop
```


### Verification

First, verify that the application is correctly generating a log file in:

```
cat /opt/logs/turn_api_app_log.txt
```

Second, verify that the application webserver is accessible via web browser through the following URL endpoint:

```
http://YOUR_HOST_NAME:8080/getTURNServerArray
```




### Cassandra keyspace & table definition

Deleting old keyspace.

First, open Cassandra the command line tool.

```
/usr/src/apache-cassandra-2.0.7/bin/cqlsh
```

Delete old keyspace
```
drop keyspace turn_stats_db;
```


Creating keyspace & table: 

Copy and paste the following scripts into the Cassandra cli:

```
create keyspace turn_stats_db
  with placement_strategy = 'NetworkTopologyStrategy'
  and strategy_options = {'datacenter1' : 2, 'datacenter2' : 2}
  and durable_writes = true;
``` 

Table:
```
  CREATE TABLE turn_lb (
  server_id text,
  active_connections int,
  cpu_percentage text,
  mem_usage text,
  pid text,
  "timestamp" int,
  turn_server_ip text,
  PRIMARY KEY (server_id)
) WITH
  bloom_filter_fp_chance=0.010000 AND
  caching='KEYS_ONLY' AND
  comment='' AND
  dclocal_read_repair_chance=0.000000 AND
  gc_grace_seconds=864000 AND
  index_interval=128 AND
  read_repair_chance=0.100000 AND
  replicate_on_write='true' AND
  populate_io_cache_on_flush='false' AND
  default_time_to_live=0 AND
  speculative_retry='99.0PERCENTILE' AND
  memtable_flush_period_in_ms=0 AND
  compaction={'class': 'SizeTieredCompactionStrategy'} AND
  compression={'sstable_compression': 'LZ4Compressor'};
```









