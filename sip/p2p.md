# Stremio P2P addons



Key used on IPNS: 'q.json?b='+base64(jsonRpcMsg)

[ JSON-RPC ]
     | 
[  IPNS  ]
     |
[  IPFS  ]


Stage 1: Use the same JSON-RPC protocol as at the moment, but auto-cache to IPNS + IPFS

Stage 2: Instead of accessing the add-on through HTTPS/DNS, auto-find peers who run the add-on and directly connect to them to call a method (if it's not cached in IPNS+IPFS) 

Stage 3: Ability to serve videos through IPFS too
