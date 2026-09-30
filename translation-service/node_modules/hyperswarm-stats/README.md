# Hyperswarm Stats

Stats for Hyperswarm, with Prometheus support.

## Install

```
npm i hyperswarm-stats
```

## Example

To use with prometheus:

```
const Hyperswarm = require('hyperswarm')
const HyperswarmStats = require('hyperswarm-stats')
const promClient = require('prom-client')

const swarm = new Hyperswarm()
const stats = new HyperswarmStats(swarm)

stats.registerPrometheusMetrics(promClient)

// In practice metrics are exposed to a metrics scraper
const metrics = await promClient.register.metrics()
console.log(metrics)
```

## Usage Without Prometheus

`swarmStats.toString()` returns a string overview of all hyperswarm and DHT stats.

`swarmStats.toJson()` returns a JSON overview of all hyperswarm and DHT stats.
