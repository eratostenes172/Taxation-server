module.exports = {
  apps: [
    {
      name: "taxation-server",
      script: "./index.js",
      exp_backoff_restart_delay: 1000,
      instances: 1,
      exec_mode: "cluster",
      env: {
        "PORT": 8000,
        "NODE_ENV": "production",
      }
    },  /*{
      name: "taxation-wss",
      script: "./websocket.js",
      exp_backoff_restart_delay: 1000,
      instances: 1,
      exec_mode: "cluster",
      env: {
        "PORT": 3000,
        "NODE_ENV": "production",
      }
    }*/
  ]
}
