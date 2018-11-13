# Raspi installation

```
docker run --name agc-logic --restart=always -d -v /data/agc-logic:/opt/app -e APP_DIR=/opt/app/app -e APP_START="node src/start.js" -e DATA_DIR=/opt/app/data -e MQTT=10.1.0.12 -e REPOSITORY=https://github.com/burgrp/agc-logic-416 burgrp/npg-rpi
```